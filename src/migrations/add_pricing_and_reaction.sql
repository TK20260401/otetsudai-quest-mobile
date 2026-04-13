-- 報酬プライシング: タスクへの値下げ/値上げコメント
ALTER TABLE otetsudai_tasks
ADD COLUMN IF NOT EXISTS price_change_comment TEXT;

-- 子ども返信リアクション: タスクログへの返信フィールド
ALTER TABLE otetsudai_task_logs
ADD COLUMN IF NOT EXISTS child_reaction_stamp TEXT;

ALTER TABLE otetsudai_task_logs
ADD COLUMN IF NOT EXISTS child_reaction_message TEXT;

ALTER TABLE otetsudai_task_logs
ADD COLUMN IF NOT EXISTS child_reaction_at TIMESTAMPTZ;
