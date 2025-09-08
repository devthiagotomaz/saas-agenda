/*
  # Complete Database Schema Setup

  1. New Tables
    - `user_profiles` - Basic user information for both clients and providers
    - `provider_profiles` - Extended information specific to service providers
    - `services` - Services offered by providers with pricing and duration
    - `appointments` - Booking records between clients and providers
    - `available_times` - Provider availability schedule

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access control
    - Providers can manage their own data
    - Clients can manage their own appointments
    - Public can read provider information for discovery

  3. Triggers
    - Auto-update timestamps on profile changes
    - Ensure data consistency
*/

-- Criar tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL CHECK (user_type IN ('cliente', 'prestador')),
  name text NOT NULL,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de perfis de prestadores
CREATE TABLE IF NOT EXISTS provider_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  experience text,
  specialties text[] DEFAULT '{}',
  working_hours jsonb DEFAULT '{}',
  is_verified boolean DEFAULT false,
  average_rating numeric(3,2) DEFAULT 0.00,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de serviços
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration integer NOT NULL, -- em minutos
  price integer NOT NULL, -- em centavos para evitar problemas de precisão
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de horários disponíveis
CREATE TABLE IF NOT EXISTS available_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_verified ON provider_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_available_times_provider ON available_times(provider_id);
CREATE INDEX IF NOT EXISTS idx_available_times_day ON available_times(day_of_week);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_times ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem (para evitar conflitos)
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public can read provider profiles" ON user_profiles;
DROP POLICY IF EXISTS "profile_select_own" ON user_profiles;
DROP POLICY IF EXISTS "profile_update_own" ON user_profiles;
DROP POLICY IF EXISTS "profile_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "profile_select_providers_public" ON user_profiles;

DROP POLICY IF EXISTS "Providers can manage own profile" ON provider_profiles;
DROP POLICY IF EXISTS "Public can read provider profiles" ON provider_profiles;
DROP POLICY IF EXISTS "provider_profile_all_own" ON provider_profiles;
DROP POLICY IF EXISTS "provider_profile_select_public" ON provider_profiles;

DROP POLICY IF EXISTS "Providers can manage own services" ON services;
DROP POLICY IF EXISTS "Public can read services" ON services;
DROP POLICY IF EXISTS "services_all_provider" ON services;
DROP POLICY IF EXISTS "services_select_public" ON services;

DROP POLICY IF EXISTS "Users can read own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON appointments;
DROP POLICY IF EXISTS "Providers can update appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
DROP POLICY IF EXISTS "appointments_select_participants" ON appointments;
DROP POLICY IF EXISTS "appointments_insert_client" ON appointments;
DROP POLICY IF EXISTS "appointments_update_provider" ON appointments;
DROP POLICY IF EXISTS "appointments_update_client" ON appointments;

DROP POLICY IF EXISTS "Providers can manage own times" ON available_times;
DROP POLICY IF EXISTS "Public can read available times" ON available_times;
DROP POLICY IF EXISTS "available_times_all_provider" ON available_times;
DROP POLICY IF EXISTS "available_times_select_public" ON available_times;

-- Políticas de segurança para user_profiles
CREATE POLICY "profile_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profile_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profile_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profile_select_providers_public" ON user_profiles
  FOR SELECT USING (user_type = 'prestador');

-- Políticas de segurança para provider_profiles
CREATE POLICY "provider_profile_all_own" ON provider_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "provider_profile_select_public" ON provider_profiles
  FOR SELECT USING (true);

-- Políticas de segurança para services
CREATE POLICY "services_all_provider" ON services
  FOR ALL USING (auth.uid() = provider_id);

CREATE POLICY "services_select_public" ON services
  FOR SELECT USING (true);

-- Políticas de segurança para appointments
CREATE POLICY "appointments_select_participants" ON appointments
  FOR SELECT USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "appointments_insert_client" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "appointments_update_provider" ON appointments
  FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "appointments_update_client" ON appointments
  FOR UPDATE USING (auth.uid() = client_id);

-- Políticas de segurança para available_times
CREATE POLICY "available_times_all_provider" ON available_times
  FOR ALL USING (auth.uid() = provider_id);

CREATE POLICY "available_times_select_public" ON available_times
  FOR SELECT USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover triggers existentes se existirem
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_provider_profiles_updated_at ON provider_profiles;

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at 
  BEFORE UPDATE ON provider_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();