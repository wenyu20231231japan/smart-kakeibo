"use client";

import { BilingualText } from "@/components/BilingualText";
import type { AuthSession } from "@/lib/auth/supabaseAuth";

type Props = {
  session: AuthSession | null;
  isSynced: boolean;
  onSignOut: () => void;
};

export function AccountMenu({ session, isSynced, onSignOut }: Props) {
  if (!session) {
    return (
      <span className="account-menu signed-out">
        <BilingualText ja="未ログイン" zh="未登录" />
      </span>
    );
  }

  return (
    <details className="account-menu">
      <summary>
        <span>{isSynced ? "✓ 已同步" : "本机保存中"}</span>
      </summary>
      <div className="account-menu-popover">
        <p>{session.user.email}</p>
        <button type="button" onClick={onSignOut}>
          <BilingualText ja="ログアウト" zh="退出登录" />
        </button>
      </div>
    </details>
  );
}
