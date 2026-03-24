CREATE TABLE IF NOT EXISTS workspace_class_structures (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  period_count INTEGER NOT NULL DEFAULT 1,
  group_count INTEGER NOT NULL DEFAULT 4,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_period_count CHECK (period_count BETWEEN 1 AND 12),
  CONSTRAINT chk_group_count CHECK (group_count BETWEEN 1 AND 12)
);
