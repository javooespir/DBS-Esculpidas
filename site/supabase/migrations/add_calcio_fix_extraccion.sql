-- Agregar Calcio final como extra
INSERT INTO services (slug, name, description, price_ars, duration_minutes, deposit_ars, active, display_order, is_addon, addon_per_nail)
VALUES ('extra-calcio-final', 'Calcio final', NULL, 5000, 10, 0, true, 105, true, false)
ON CONFLICT (slug) DO NOTHING;

-- Pasar "Extracción de otro estudio" a servicio regular (visible en el landing y en el flujo de reserva)
-- También se ajusta el display_order para que aparezca al final de los servicios principales
UPDATE services
SET is_addon = false,
    display_order = 10
WHERE slug = 'extra-extraccion-otro';
