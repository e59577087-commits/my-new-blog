import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const authStatus = readFileSync(resolve(root, "src", "components", "AuthStatus.astro"), "utf8");
const authPanel = readFileSync(resolve(root, "src", "components", "AuthPanel.astro"), "utf8");
const loginPage = readFileSync(resolve(root, "src", "pages", "login.astro"), "utf8");
const markup = authStatus.split("<script>")[0];

test("shows only an avatar account link in the signed-in navigation state", () => {
  const signedIn = markup.match(/<div data-auth-user[\s\S]*?<\/div>/)?.[0];
  assert.ok(signedIn, "signed-in navigation state is missing");

  assert.match(signedIn, /<a[^>]*data-auth-avatar-link[^>]*aria-label="账户设置"/);
  assert.match(signedIn, /<img[^>]*data-auth-avatar[^>]*alt="用户头像"/);
  assert.doesNotMatch(signedIn, /data-auth-name/);
  assert.doesNotMatch(signedIn, /data-auth-signout/);
  assert.doesNotMatch(signedIn, />\s*退出\s*</);
});

test("describes the avatar-only signed-in navigation on the login page", () => {
  assert.match(loginPage, /登录成功后，导航栏只显示用户头像。/);
  assert.doesNotMatch(loginPage, /导航栏会显示用户头像和昵称/);
});

test("offers an accessible inline nickname editor on the signed-in account panel", () => {
  assert.match(authPanel, /data-name-edit[^>]*aria-controls="auth-name-form"[^>]*aria-expanded="false"/);
  assert.match(authPanel, /<form[^>]*id="auth-name-form"[^>]*data-name-form[^>]*hidden/);
  assert.match(authPanel, /data-name-input[^>]*autocomplete="nickname"[^>]*maxlength="24"[^>]*required/);
  assert.match(authPanel, /data-name-save[^>]*>\s*保存\s*<\/button>/);
  assert.match(authPanel, /data-name-cancel[^>]*>\s*取消\s*<\/button>/);
});

test("normalizes and persists the nickname in Supabase user metadata", () => {
  assert.match(authPanel, /const normalizeDisplayName = \(value\) => value\.trim\(\)\.replace\(\/\\s\+\/g, " "\)/);
  assert.match(authPanel, /\[\.\.\.nextName\]\.length > 24/);
  assert.match(authPanel, /supabase\.auth\.updateUser\(\{\s*data:\s*\{\s*name:\s*nextName\s*\}\s*\}\)/s);
  assert.match(authPanel, /notifyAuthUpdated\(\)[\s\S]*?setMessage\("昵称已更新。"\)/);
});
