CREATE TABLE IF NOT EXISTS measurement_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  measurement_id UUID NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  edited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  field_name TEXT NOT NULL CHECK (field_name IN ('pm25', 'co', 'temp', 'humidity')),
  original_value DOUBLE PRECISION NOT NULL,
  edited_value DOUBLE PRECISION NOT NULL,
  edit_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_measurement_edits_measurement_id_created
  ON measurement_edits(measurement_id, created_at DESC);
