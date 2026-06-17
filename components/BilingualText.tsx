type Props = {
  ja: string;
  zh: string;
  className?: string;
};

export function BilingualText({ ja, zh, className = "" }: Props) {
  return (
    <span className={`bilingual ${className}`.trim()}>
      <span className="bilingual-ja">{ja}</span>
      <span className="bilingual-zh">{zh}</span>
    </span>
  );
}
