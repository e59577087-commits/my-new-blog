import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const productionSupabaseUrl = "https://govdfuzkcnbsnvozzqwb.supabase.co";
const productionSupabaseAnonKey = "sb_publishable_OmoC6JlLIwPfcj0SsEXxNQ_fP3M_VO7";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || productionSupabaseUrl;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || productionSupabaseAnonKey;

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
  user.user_metadata?.custom_avatar || user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

export const getUserOriginalAvatar = (user: User) =>
  user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const AVATAR_DIMENSION = 256;

const resizeImage = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_DIMENSION;
      canvas.height = AVATAR_DIMENSION;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, AVATAR_DIMENSION, AVATAR_DIMENSION);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Image resize failed"))),
        "image/webp",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });

export const uploadUserAvatar = async (supabase: ReturnType<typeof createBrowserSupabaseClient>, userId: string, file: File): Promise<{ url: string; error?: string }> => {
  if (!supabase || !userId) return { url: "", error: "Not configured" };
  if (file.size > MAX_AVATAR_SIZE) return { url: "", error: "File exceeds 2 MB" };

  const blob = await resizeImage(file);
  const ext = "webp";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, blob, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "604800",
  });
  if (uploadError) return { url: "", error: uploadError.message };

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  // Append a version so the long CDN cache is bypassed immediately after re-upload.
  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase.auth.updateUser({
    data: { custom_avatar: publicUrl },
  });
  if (updateError) return { url: "", error: updateError.message };

  return { url: publicUrl };
};

export const resetUserAvatar = async (supabase: ReturnType<typeof createBrowserSupabaseClient>): Promise<void> => {
  if (!supabase) return;
  await supabase.auth.updateUser({ data: { custom_avatar: null } });
};

export const getFallbackAvatar = (name: string) => {
  const initial = ([...name.trim()][0] ?? "用")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#16181d"/><text x="48" y="58" text-anchor="middle" font-family="MiSans, Noto Sans SC, Microsoft YaHei, sans-serif" font-size="34" font-weight="700" fill="#7dd3fc">${initial}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
