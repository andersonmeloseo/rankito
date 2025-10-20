-- Habilitar realtime para conversões
ALTER PUBLICATION supabase_realtime ADD TABLE rank_rent_conversions;

-- Habilitar realtime para pagamentos
ALTER PUBLICATION supabase_realtime ADD TABLE rank_rent_payments;

-- Habilitar realtime para sites
ALTER PUBLICATION supabase_realtime ADD TABLE rank_rent_sites;