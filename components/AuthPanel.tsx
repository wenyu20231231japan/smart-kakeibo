"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { BilingualText } from "@/components/BilingualText";
import type { AuthSession } from "@/lib/auth/supabaseAuth";

type Props = {
  session: AuthSession | null;
  isConfigured: boolean;
  isLoading: boolean;
  message: string;
  compact?: boolean;
  onSendLoginEmail: (email: string) => Promise<void>;
  onSignOut: () => void;
};

export function AuthPanel({
  session,
  isConfigured,
  isLoading,
  message,
  compact = false,
  onSendLoginEmail,
  onSignOut
}: Props) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      return;
    }

    setIsSending(true);
    try {
      await onSendLoginEmail(email.trim());
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className={compact ? "auth-panel compact" : "panel auth-panel"}>
      <div className="auth-header">
        <div>
          {!compact ? (
            <h2>
              <BilingualText ja="ログイン状態" zh="登录状态" />
            </h2>
          ) : null}
          <p>
            {session ? (
              <BilingualText ja="クラウド家計簿にログイン中" zh="已登录云端账本" />
            ) : (
              <BilingualText ja="ログイン後に記録できます" zh="登录后使用记账功能" />
            )}
          </p>
        </div>
        {session ? (
          <button className="ghost-button" type="button" onClick={onSignOut}>
            <BilingualText ja="ログアウト" zh="退出登录" />
          </button>
        ) : null}
      </div>

      {session ? (
        <p className="auth-user">{session.user.email}</p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <BilingualText ja="メールアドレス" zh="邮箱地址" />
            <input
              type="email"
              value={email}
              disabled={!isConfigured || isLoading || isSending}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <button className="primary-button" type="submit" disabled={!isConfigured || isLoading || isSending}>
            {isSending ? (
              <BilingualText ja="送信中..." zh="发送中..." />
            ) : (
              <BilingualText ja="ログインメールを送る" zh="发送登录邮件" />
            )}
          </button>
        </form>
      )}

      {!isConfigured ? (
        <p className="form-error">
          <BilingualText ja="Supabase設定が必要です。" zh="需要先配置 Supabase 环境变量。" />
        </p>
      ) : null}

      {message ? <p className="auth-message">{message}</p> : null}
    </section>
  );
}
