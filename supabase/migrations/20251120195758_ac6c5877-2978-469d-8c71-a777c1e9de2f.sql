-- Adicionar campos para múltiplos agendamentos
ALTER TABLE gsc_schedule_config 
  ADD COLUMN IF NOT EXISTS schedule_name TEXT NOT NULL DEFAULT 'Agendamento Principal',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Remover constraint antiga de site_id único (se existir)
ALTER TABLE gsc_schedule_config 
  DROP CONSTRAINT IF EXISTS gsc_schedule_config_site_id_key;

-- Adicionar constraint de nome único por site
ALTER TABLE gsc_schedule_config 
  ADD CONSTRAINT gsc_schedule_config_site_name_unique UNIQUE(site_id, schedule_name);