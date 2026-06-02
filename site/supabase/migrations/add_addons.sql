-- Add addon columns to services
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS addon_per_nail BOOLEAN DEFAULT FALSE NOT NULL;

-- Add extras column to appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS extras JSONB DEFAULT '[]'::jsonb;

-- Seed the 5 addon services
INSERT INTO services (slug, name, description, price_ars, duration_minutes, deposit_ars, active, display_order, is_addon, addon_per_nail) VALUES
  ('extra-una-rota', 'Uña rota o desprendida', NULL, 3000, 10, 0, true, 100, true, false),
  ('extra-deco-una', 'Decoración por uña', 'Nail art, polvo, pedrería o dije. Por uña (1-9).', 600, 5, 0, true, 101, true, true),
  ('extra-full-deco', 'Full deco', NULL, 10000, 30, 0, true, 102, true, false),
  ('extra-extraccion-otro', 'Extracción de otro estudio', NULL, 15000, 30, 0, true, 103, true, false),
  ('extra-extraccion-db', 'Extracción DB', NULL, 10000, 30, 0, true, 104, true, false)
ON CONFLICT (slug) DO NOTHING;
