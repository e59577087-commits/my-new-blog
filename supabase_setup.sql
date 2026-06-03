-- 在 Supabase SQL Editor 中运行以下 SQL 来创建访问计数表
-- https://govdfuzkcnbsnvozzqwb.supabase.co → SQL Editor

-- 创建表
CREATE TABLE IF NOT EXISTS site_visits (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count BIGINT DEFAULT 1,
  CHECK (id = 1)
);

-- 插入初始数据（如果不存在）
INSERT INTO site_visits (id, count)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

-- 允许匿名读取
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read visit count" ON site_visits;
CREATE POLICY "Anyone can read visit count" ON site_visits
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update count" ON site_visits;
CREATE POLICY "Anyone can update count" ON site_visits
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can insert" ON site_visits;
CREATE POLICY "Anyone can insert" ON site_visits
  FOR INSERT WITH CHECK (true);
