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
  working_hours jsonb,
  is_verified boolean DEFAULT false,
  average_rating numeric(3,2) DEFAULT 0,
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
  price numeric(10,2) NOT NULL,
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

-- Políticas de segurança para user_profiles
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can read provider profiles" ON user_profiles
  FOR SELECT USING (user_type = 'prestador');

-- Políticas de segurança para provider_profiles
CREATE POLICY "Providers can manage own profile" ON provider_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Public can read provider profiles" ON provider_profiles
  FOR SELECT USING (true);

-- Políticas de segurança para services
CREATE POLICY "Providers can manage own services" ON services
  FOR ALL USING (auth.uid() = provider_id);

CREATE POLICY "Public can read services" ON services
  FOR SELECT USING (true);

-- Políticas de segurança para appointments
CREATE POLICY "Users can read own appointments" ON appointments
  FOR SELECT USING (auth.uid() = provider_id OR auth.uid() = client_id);

CREATE POLICY "Clients can create appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Providers can update appointments" ON appointments
  FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- Políticas de segurança para available_times
CREATE POLICY "Providers can manage own times" ON available_times
  FOR ALL USING (auth.uid() = provider_id);

CREATE POLICY "Public can read available times" ON available_times
  FOR SELECT USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at 
  BEFORE UPDATE ON provider_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();