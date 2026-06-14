-- malna AI活用量ダッシュボード Supabaseスキーマ
-- Supabase SQL Editor で実行する。
create table if not exists usage_snapshots (
  id bigint generated always as identity primary key,
  captured_at timestamptz,
  snapshot_date date not null,
  member_name text,
  member_email text not null,
  team text,
  hostname text,
  month text not null,
  input bigint,
  output bigint,
  cache_create bigint,
  cache_read bigint,
  total_tokens bigint,
  cost_usd numeric,
  claude_tokens bigint,
  claude_cost numeric,
  codex_tokens bigint,
  codex_cost numeric,
  models_used text,
  ccusage_version text,
  model_breakdown text,
  unique (member_email, month, snapshot_date)
);

-- 既存テーブルに後から列を足す場合（マイグレーション用）:
-- alter table usage_snapshots add column if not exists model_breakdown text;

-- クライアントからの直接アクセスは無し（Next.jsサーバーが service role で読む）。
alter table usage_snapshots enable row level security;
