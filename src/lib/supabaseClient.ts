import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const createBrowserSupabaseClient = () => {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return null;

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const getUserDisplayName = (user: User) =>
  user.user_metadata?.name ||
  user.user_metadata?.full_name ||
  user.user_metadata?.user_name ||
  user.email?.split("@")[0] ||
  "已登录用户";

export const getUserAvatar = (user: User) =>
  user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

export const getFallbackAvatar = (name: string) => {
  const initial = ([...name.trim()][0] ?? "用")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#16181d"/><text x="48" y="58" text-anchor="middle" font-family="MiSans, Noto Sans SC, Microsoft YaHei, sans-serif" font-size="34" font-weight="700" fill="#7dd3fc">${initial}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
