"use client";

import { BilingualText } from "@/components/BilingualText";

type Props = {
  value: string;
  onChange: (value: string) => void;
  imageDataUrls: string[];
  isCompressingImage: boolean;
  onImagesSelected: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  onParse: () => void;
  error: string;
};

export function NaturalLanguageInput({
  value,
  onChange,
  imageDataUrls,
  isCompressingImage,
  onImagesSelected,
  onRemoveImage,
  onParse,
  error
}: Props) {
  return (
    <section className="panel input-panel">
      <label htmlFor="natural-input">
        <BilingualText ja="自然言語で記録" zh="自然语言记账" />
      </label>
      <textarea
        id="natural-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="例如：今天在コーナン买了地板革、防潮纸和胶带，一共12800日元"
        rows={5}
      />
      <div className="image-upload-row">
        <label className="upload-button" htmlFor="image-upload">
          <BilingualText ja="画像をアップロード" zh="上传图片" />
        </label>
        <input
          id="image-upload"
          className="visually-hidden"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={(event) => {
            onImagesSelected(event.target.files);
            event.target.value = "";
          }}
        />
        {isCompressingImage ? (
          <span className="upload-status">
            <BilingualText ja="画像を圧縮中..." zh="正在压缩图片..." />
          </span>
        ) : null}
      </div>
      {imageDataUrls.length > 0 ? (
        <div className="upload-preview-list" aria-label="已上传图片">
          {imageDataUrls.map((imageDataUrl, index) => (
            <div className="upload-preview-item" key={`${imageDataUrl.slice(0, 32)}-${index}`}>
              {/* data URL previews come from localStorage, so Next Image optimization is not applicable. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageDataUrl} alt={`已上传图片 ${index + 1}`} />
              <button type="button" onClick={() => onRemoveImage(index)}>
                <BilingualText ja="削除" zh="删除" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary-button" type="button" onClick={onParse}>
        <BilingualText ja="認識する" zh="识别" />
      </button>
    </section>
  );
}
