-- =====================================================================
-- DBS Esculpidas — Schema SQL
-- Pegar este archivo en Supabase Dashboard → SQL Editor → New Query → Run
-- =====================================================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- Tabla: services (servicios disponibles)
-- ---------------------------------------------------------------------
create table if not exists services (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  price_ars integer not null,
  duration_minutes integer not null,
  deposit_ars integer not null default 10000,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Tabla: appointments (turnos reservados)
-- ---------------------------------------------------------------------
create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  service_id uuid references services(id) on delete restrict,
  client_name text not null,
  client_phone text not null,
  client_email text not null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'deposit_paid', 'cancelled', 'completed', 'no_show')),
  notes text,
  cancellation_reason text,
  cancelled_at timestamptz,
  cancelled_by text check (cancelled_by in ('client', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists appointments_scheduled_at_idx on appointments(scheduled_at);
create index if not exists appointments_status_idx on appointments(status);

-- ---------------------------------------------------------------------
-- Tabla: blocked_slots (bloqueos manuales del admin)
-- start_at/end_at definen el rango bloqueado.
-- ---------------------------------------------------------------------
create table if not exists blocked_slots (
  id uuid primary key default uuid_generate_v4(),
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz default now()
);

create index if not exists blocked_slots_range_idx on blocked_slots(start_at, end_at);

-- ---------------------------------------------------------------------
-- Tabla: testimonials (testimonios editables desde admin)
-- ---------------------------------------------------------------------
create table if not exists testimonials (
  id uuid primary key default uuid_generate_v4(),
  client_name text not null,
  text text not null,
  rating integer default 5 check (rating between 1 and 5),
  visible boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Tabla: settings (config global key/value)
-- ---------------------------------------------------------------------
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Trigger: actualizar updated_at en appointments
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists appointments_updated_at on appointments;
create trigger appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- RLS (Row Level Security)
-- Solo el service_role (backend) puede escribir.
-- Lectura pública para servicios y testimonios visibles.
-- ---------------------------------------------------------------------
alter table services enable row level security;
alter table appointments enable row level security;
alter table blocked_slots enable row level security;
alter table testimonials enable row level security;
alter table settings enable row level security;

-- Lectura pública de servicios activos
drop policy if exists "services_public_read" on services;
create policy "services_public_read" on services
  for select using (active = true);

-- Lectura pública de testimonios visibles
drop policy if exists "testimonials_public_read" on testimonials;
create policy "testimonials_public_read" on testimonials
  for select using (visible = true);

-- El resto (appointments, blocked_slots, settings) solo accesible vía service_role
-- (las API routes usan service_role, así que no necesitan policies adicionales)

-- ---------------------------------------------------------------------
-- SEED DATA — Servicios iniciales
-- ---------------------------------------------------------------------
insert into services (slug, name, description, price_ars, duration_minutes, deposit_ars, display_order)
values
  ('esculpidas-acrilico', 'Uñas esculpidas en acrílico', 'Hasta largo nro. 2', 28000, 90, 10000, 1),
  ('capping-acrilico', 'Capping en acrílico', 'Refuerzo y diseño en acrílico', 25000, 60, 10000, 2),
  ('capping-gel', 'Capping gel', 'Refuerzo y diseño en gel', 22000, 60, 10000, 3),
  ('semi-manos', 'Esmaltado semipermanente en manos', 'Esmaltado de larga duración', 20000, 60, 10000, 4),
  ('semi-pies', 'Esmaltado semipermanente en pies', 'Esmaltado de larga duración', 20000, 30, 10000, 5),
  ('belleza-manos', 'Belleza de manos', 'Sin esmaltar', 15000, 30, 10000, 6)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- SEED DATA — Testimonios placeholder (editables desde admin)
-- ---------------------------------------------------------------------
insert into testimonials (client_name, text, rating, display_order)
values
  ('Camila R.', 'Atención impecable y un trabajo precioso. Las uñas me duraron perfectas hasta el mantenimiento. Súper recomendable.', 5, 1),
  ('Florencia M.', 'Es un mimo entrar al estudio. Higiene total, buena onda y los diseños son una maravilla. Encontré mi lugar.', 5, 2),
  ('Belén G.', 'Me encantó la experiencia. Profesionalismo de principio a fin y el resultado fue mejor de lo que esperaba.', 5, 3)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- SEED DATA — Configuración inicial
-- ---------------------------------------------------------------------
insert into settings (key, value) values
  ('about_text', '"En DBS Esculpidas creemos que cuidarte es un acto de amor propio. Cada turno está pensado para que vivas una experiencia tranquila, en un ambiente impecable y con materiales de primera calidad. La higiene y el detalle son innegociables."'::jsonb)
on conflict (key) do update set value = excluded.value;

-- =====================================================================
-- LISTO. La base está armada.
-- =====================================================================
