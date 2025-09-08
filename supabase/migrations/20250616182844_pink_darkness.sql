/*
  # Schema completo para sistema de agendamentos

  1. Novas Tabelas
    - `user_profiles` - Perfis de usuários (clientes e prestadores)
    - `provider_profiles` - Dados específicos de prestadores
    - `services` - Serviços oferecidos pelos prestadores
    - `appointments` - Agendamentos entre clientes e prestadores
    - `available_times` - Horários disponíveis dos prestadores

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para controle de acesso baseado em autenticação
    - Usuários só podem ver/editar seus próprios dados
    - Perfis de prestadores são públicos para visualização

  3. Funcionalidades
    - Triggers para atualização automática de timestamps
    - Constraints para validação de dados
    - Foreign keys para integridade referencial
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

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE available_times ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver (para evitar conflitos)
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Public can read provider profiles" ON user_profiles;
DROP POLICY IF EXISTS "Perfis de prestadores são públicos" ON user_profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON user_profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios perfis" ON user_profiles;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios perfis" ON user_profiles;

DROP POLICY IF EXISTS "Providers can manage own profile" ON provider_profiles;
DROP POLICY IF EXISTS "Public can read provider profiles" ON provider_profiles;
DROP POLICY IF EXISTS "Perfis de prestadores são públicos para visualização" ON provider_profiles;
DROP POLICY IF EXISTS "Prestadores podem atualizar seus próprios perfis" ON provider_profiles;
DROP POLICY IF EXISTS "Prestadores podem inserir seus próprios perfis" ON provider_profiles;
DROP POLICY IF EXISTS "Prestadores podem ver seus próprios perfis" ON provider_profiles;

DROP POLICY IF EXISTS "Providers can manage own services" ON services;
DROP POLICY IF EXISTS "Public can read services" ON services;
DROP POLICY IF EXISTS "Anyone can read services" ON services;
DROP POLICY IF EXISTS "Providers can manage their services" ON services;

DROP POLICY IF EXISTS "Users can read own appointments" ON appointments;
DROP POLICY IF EXISTS "Clients can create appointments" ON appointments;
DROP POLICY IF EXISTS "Providers can update appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can read their appointments" ON appointments;
DROP POLICY IF EXISTS "Providers can update appointment status" ON appointments;

DROP POLICY IF EXISTS "Providers can manage own times" ON available_times;
DROP POLICY IF EXISTS "Public can read available times" ON available_times;
DROP POLICY IF EXISTS "Anyone can read available times" ON available_times;
DROP POLICY IF EXISTS "Providers can manage their available times" ON available_times;

-- Políticas de segurança para user_profiles
CREATE POLICY "Usuários podem ver seus próprios perfis" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seus próprios perfis" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Perfis de prestadores são públicos" ON user_profiles
  FOR SELECT USING (user_type = 'prestador');

-- Políticas de segurança para provider_profiles
CREATE POLICY "Prestadores podem ver seus próprios perfis" ON provider_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Prestadores podem atualizar seus próprios perfis" ON provider_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Prestadores podem inserir seus próprios perfis" ON provider_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Perfis de prestadores são públicos para visualização" ON provider_profiles
  FOR SELECT USING (true);

-- Políticas de segurança para services
CREATE POLICY "Providers can manage their services" ON services
  FOR ALL USING (auth.uid() = provider_id);

CREATE POLICY "Anyone can read services" ON services
  FOR SELECT USING (true);

-- Políticas de segurança para appointments
CREATE POLICY "Users can read their appointments" ON appointments
  FOR SELECT USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Clients can create appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Providers can update appointment status" ON appointments
  FOR UPDATE USING (auth.uid() = provider_id);

-- Políticas de segurança para available_times
CREATE POLICY "Providers can manage their available times" ON available_times
  FOR ALL USING (auth.uid() = provider_id);

CREATE POLICY "Anyone can read available times" ON available_times
  FOR SELECT USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover triggers existentes se houver
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_provider_profiles_updated_at ON provider_profiles;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at 
  BEFORE UPDATE ON provider_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();