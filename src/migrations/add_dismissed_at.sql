-- やりとりタップでクリア機能用 "dismissed_at" 列追加
-- 子供がメッセージ/やりとりをタップすると、当該行が非表示化される
-- データは保持し、親（団長）側からは引き続き履歴として閲覧可能

-- 1. 承認スタンプ＋メッセージのやりとり (子供が dismiss する)
ALTER TABLE otetsudai_task_logs
  ADD COLUMN IF NOT EXISTS child_dismissed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_task_logs_child_dismissed
  ON otetsudai_task_logs(child_id, child_dismissed_at)
  WHERE child_dismissed_at IS NULL;

-- 2. ファミリースタンプリレーメッセージ (受信者が dismiss する)
ALTER TABLE otetsudai_family_messages
  ADD COLUMN IF NOT EXISTS dismissed_by_recipient_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_family_messages_dismissed
  ON otetsudai_family_messages(recipient_id, dismissed_by_recipient_at)
  WHERE dismissed_by_recipient_at IS NULL;

-- RLS は既存ポリシーに従う（dismissed_at の更新は所有者本人のみ可能を想定）
-- 必要に応じて以下のポリシーを追加:
-- CREATE POLICY "child_can_dismiss_own_logs" ON otetsudai_task_logs
--   FOR UPDATE USING (child_id = auth.uid()) WITH CHECK (child_id = auth.uid());
