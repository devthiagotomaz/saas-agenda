import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Star, TrendingUp, Plus, Settings, Users, Award, Zap, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { useToast } from '../components/ToastNotification';

export function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0,
    totalServices: 0,
  });
  const [loading, setLoading] = useState(true);
  const { showSuccess, showInfo } = useToast();

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserProfile();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (userProfile && user) {
      fetchStats();
    }
  }, [userProfile, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
      showInfo(`Bem-vindo(a), ${data.name}!`);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const fetchStats = async () => {
    if (!user || !userProfile) return;
    
    try {
      if (userProfile.user_type === 'prestador') {
        // Stats for providers
        const { data: appointments } = await supabase
          .from('appointments')
          .select('status')
          .eq('provider_id', user.id);

        const { data: services } = await supabase
          .from('services')
          .select('id')
          .eq('provider_id', user.id);

        setStats({
          totalAppointments: appointments?.length || 0,
          pendingAppointments: appointments?.filter(a => a.status === 'pending').length || 0,
          completedAppointments: appointments?.filter(a => a.status === 'confirmed').length || 0,
          totalServices: services?.length || 0,
        });
      } else {
        // Stats for clients
        const { data: appointments } = await supabase
          .from('appointments')
          .select('status')
          .eq('client_id', user.id);

        setStats({
          totalAppointments: appointments?.length || 0,
          pendingAppointments: appointments?.filter(a => a.status === 'pending').length || 0,
          completedAppointments: appointments?.filter(a => a.status === 'confirmed').length || 0,
          totalServices: 0,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="spinner mx-auto mb-6"></div>
          <p className="text-gray-600 text-xl">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="card max-w-lg mx-auto">
          <Users className="h-20 w-20 text-gray-400 mx-auto mb-6" />
          <p className="text-gray-500 text-xl mb-6">Você precisa estar logado para acessar esta página</p>
          <Link to="/login" className="btn btn-primary">
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header Premium */}
      <div className="card-glass text-white text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-slow">
            <Award className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Olá, {userProfile?.name || 'Usuário'}! 👋
        </h1>
        <p className="text-white/90 text-xl max-w-3xl mx-auto leading-relaxed">
          {userProfile?.user_type === 'prestador' 
            ? 'Gerencie seus serviços e agendamentos como prestador de serviços premium'
            : 'Encontre e agende serviços com prestadores qualificados na sua região'
          }
        </p>
      </div>

      {/* User Type Badge */}
      {userProfile && (
        <div className="flex items-center justify-center">
          <span className={`badge text-lg px-6 py-3 ${
            userProfile.user_type === 'prestador' 
              ? 'badge-info' 
              : 'badge-success'
          }`}>
            <Users className="h-6 w-6 mr-3" />
            {userProfile.user_type === 'prestador' ? 'Prestador de Serviços Premium' : 'Cliente VIP'}
          </span>
        </div>
      )}

      {/* Stats Grid Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="stat-card hover-lift">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total de Agendamentos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAppointments}</p>
            </div>
          </div>
        </div>

        <div className="stat-card hover-lift">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Pendentes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingAppointments}</p>
            </div>
          </div>
        </div>

        <div className="stat-card hover-lift">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div className="ml-6">
              <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Concluídos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedAppointments}</p>
            </div>
          </div>
        </div>

        {userProfile?.user_type === 'prestador' && (
          <div className="stat-card hover-lift">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Star className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6">
                <p className="text-sm font-bold text-gray-600 uppercase tracking-wide">Meus Serviços</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalServices}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions Premium */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
          <Zap className="h-7 w-7 mr-3 text-yellow-500" />
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userProfile?.user_type === 'prestador' ? (
            <>
              <Link to="/services" className="btn btn-primary flex items-center justify-center text-lg py-4 hover-lift">
                <Plus className="h-6 w-6 mr-3" />
                Gerenciar Serviços
              </Link>
              <Link to="/provider-dashboard" className="btn btn-secondary flex items-center justify-center text-lg py-4 hover-lift">
                <Calendar className="h-6 w-6 mr-3" />
                Ver Agendamentos
              </Link>
              <Link to="/profile" className="btn btn-secondary flex items-center justify-center text-lg py-4 hover-lift">
                <Settings className="h-6 w-6 mr-3" />
                Configurar Perfil
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className="btn btn-primary flex items-center justify-center text-lg py-4 hover-lift">
                <Star className="h-6 w-6 mr-3" />
                Buscar Serviços
              </Link>
              <Link to="/appointments" className="btn btn-secondary flex items-center justify-center text-lg py-4 hover-lift">
                <Calendar className="h-6 w-6 mr-3" />
                Meus Agendamentos
              </Link>
              <Link to="/profile" className="btn btn-secondary flex items-center justify-center text-lg py-4 hover-lift">
                <Settings className="h-6 w-6 mr-3" />
                Meu Perfil
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Welcome Message Premium */}
      {userProfile?.user_type === 'prestador' ? (
        <div className="card-glass text-white">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold ml-6">
              Bem-vindo, Prestador Premium!
            </h3>
          </div>
          <p className="text-white/90 text-lg leading-relaxed">
            Como prestador de serviços premium, você pode cadastrar seus serviços, definir preços e horários, 
            e receber agendamentos de clientes qualificados. Complete seu perfil para atrair mais clientes e 
            construir uma reputação sólida na plataforma!
          </p>
          <div className="flex items-center mt-6 space-x-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
              <span className="text-white/90">Até 5 agendamentos gratuitos</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
              <span className="text-white/90">Perfil verificado</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
              <span className="text-white/90">Suporte premium</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-glass text-white">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold ml-6">
              Bem-vindo, Cliente VIP!
            </h3>
          </div>
          <p className="text-white/90 text-lg leading-relaxed">
            Como cliente VIP, você tem acesso aos melhores prestadores de serviços da sua região. 
            Busque serviços, veja avaliações detalhadas e faça agendamentos com facilidade e segurança. 
            Explore nossa variedade de serviços premium disponíveis!
          </p>
          <div className="flex items-center mt-6 space-x-6">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
              <span className="text-white/90">Acesso a prestadores verificados</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
              <span className="text-white/90">Avaliações confiáveis</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-300 mr-2" />
              <span className="text-white/90">Suporte prioritário</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}