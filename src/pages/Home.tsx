import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Star, MapPin, Search, Filter, AlertCircle, Wifi, RefreshCw, ExternalLink, Shield, Settings, CheckCircle, Users, Award, Zap, Sparkles, TrendingUp, Heart } from 'lucide-react';
import { supabase, testSupabaseConnection } from '../lib/supabase';
import { useToast } from '../components/ToastNotification';

interface Provider {
  id: string;
  name: string;
  city: string;
  state: string;
  bio: string;
  avatar_url: string | null;
  provider_profile: {
    average_rating: number;
    total_reviews: number;
    is_verified: boolean;
    specialties: string[];
  };
  services: {
    id: string;
    name: string;
    price: number;
    duration: number;
  }[];
}

interface ErrorDetails {
  type: 'network' | 'auth' | 'database' | 'config' | 'cors' | 'schema' | 'kaspersky' | 'unknown';
  message: string;
  suggestion: string;
}

export function Home() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorDetails | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { showSuccess, showError, showInfo } = useToast();

  useEffect(() => {
    fetchProviders();
  }, []);

  const analyzeError = (error: any, connectionTestResult?: any): ErrorDetails => {
    const errorMessage = error.message || error.toString();
    
    if (connectionTestResult && !connectionTestResult.success) {
      if (connectionTestResult.type === 'kaspersky') {
        return {
          type: 'kaspersky',
          message: 'Kaspersky está bloqueando a conexão',
          suggestion: 'O antivírus Kaspersky está impedindo a conexão com o Supabase. Siga as instruções abaixo para resolver.'
        };
      }
      
      if (connectionTestResult.type === 'cors') {
        return {
          type: 'cors',
          message: 'Erro de CORS - Configuração necessária no Supabase',
          suggestion: 'É necessário configurar as URLs permitidas no painel do Supabase. Siga as instruções abaixo para resolver.'
        };
      }
      
      if (connectionTestResult.type === 'schema') {
        return {
          type: 'schema',
          message: 'Tabelas do banco de dados não encontradas',
          suggestion: 'As tabelas necessárias não foram criadas no banco. Execute as migrações no Supabase.'
        };
      }
      
      if (connectionTestResult.type === 'auth') {
        return {
          type: 'auth',
          message: 'Erro de autenticação com o Supabase',
          suggestion: 'Verifique se as chaves do Supabase no arquivo .env estão corretas e se o projeto está ativo.'
        };
      }
    }
    
    if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
        errorMessage.includes('kaspersky') ||
        errorMessage.includes('DNS')) {
      return {
        type: 'kaspersky',
        message: 'Kaspersky está bloqueando a conexão DNS',
        suggestion: 'O antivírus Kaspersky está impedindo a resolução DNS para o Supabase. Configure uma exceção no antivírus.'
      };
    }
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') || 
        errorMessage.includes('Connection timeout') ||
        error.name === 'TypeError') {
      return {
        type: 'kaspersky',
        message: 'Erro de conexão com o Supabase',
        suggestion: 'Este erro geralmente é causado pelo antivírus Kaspersky bloqueando a conexão. Verifique as configurações do antivírus.'
      };
    }
    
    if (errorMessage.includes('JWT') || errorMessage.includes('Invalid API key') || errorMessage.includes('unauthorized')) {
      return {
        type: 'auth',
        message: 'Erro de autenticação com o Supabase',
        suggestion: 'Verifique se as chaves do Supabase no arquivo .env estão corretas e se o projeto está ativo.'
      };
    }
    
    if (errorMessage.includes('relation') || errorMessage.includes('does not exist') || errorMessage.includes('table')) {
      return {
        type: 'schema',
        message: 'Erro de estrutura do banco de dados',
        suggestion: 'As tabelas do banco podem não estar criadas. Verifique se as migrações foram executadas no Supabase.'
      };
    }
    
    if (errorMessage.includes('Invalid URL') || errorMessage.includes('configuration')) {
      return {
        type: 'config',
        message: 'Erro de configuração',
        suggestion: 'Verifique se a URL do Supabase no arquivo .env está correta e no formato adequado.'
      };
    }
    
    return {
      type: 'unknown',
      message: errorMessage || 'Erro desconhecido',
      suggestion: 'Tente recarregar a página ou entre em contato com o suporte se o problema persistir.'
    };
  };

  const fetchProviders = async () => {
    try {
      setError(null);
      setLoading(true);
      
      if (retryCount === 0) {
        showInfo('Carregando profissionais...');
      }
      
      const connectionTest = await testSupabaseConnection();
      if (!connectionTest.success) {
        const errorDetails = analyzeError(new Error(connectionTest.error), connectionTest);
        setError(errorDetails);
        showError('Falha na conexão com o banco de dados');
        return;
      }

      const queryTimeout = 20000;
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), queryTimeout);
      });

      const userProfilesPromise = supabase
        .from('user_profiles')
        .select(`
          id,
          name,
          city,
          state,
          bio,
          avatar_url
        `)
        .eq('user_type', 'prestador');

      const { data: userProfiles, error: userError } = await Promise.race([
        userProfilesPromise,
        timeoutPromise
      ]) as any;

      if (userError) {
        if (userError.message.includes('ERR_NAME_NOT_RESOLVED') ||
            userError.message.includes('DNS') ||
            userError.message.includes('kaspersky')) {
          throw new Error('Kaspersky antivirus is blocking DNS resolution for Supabase. Please configure an exception in your antivirus settings.');
        }
        
        if (userError.message.includes('Failed to fetch') || 
            userError.message.includes('NetworkError')) {
          throw new Error('CORS configuration issue. Please add http://localhost:5173 to your Supabase project\'s Site URLs.');
        }
        
        throw new Error(`Erro ao buscar perfis: ${userError.message}`);
      }

      if (!userProfiles || userProfiles.length === 0) {
        setProviders([]);
        setLoading(false);
        showInfo('Nenhum profissional encontrado');
        return;
      }

      const providerIds = userProfiles.map(p => p.id);

      const providerProfilesPromise = supabase
        .from('provider_profiles')
        .select('*')
        .in('id', providerIds);

      const { data: providerProfiles, error: providerError } = await Promise.race([
        providerProfilesPromise,
        timeoutPromise
      ]) as any;

      if (providerError) {
        if (providerError.message.includes('ERR_NAME_NOT_RESOLVED') ||
            providerError.message.includes('DNS') ||
            providerError.message.includes('kaspersky')) {
          throw new Error('Kaspersky antivirus is blocking DNS resolution for Supabase. Please configure an exception in your antivirus settings.');
        }
        
        if (providerError.message.includes('Failed to fetch') || 
            providerError.message.includes('NetworkError')) {
          throw new Error('CORS configuration issue. Please add http://localhost:5173 to your Supabase project\'s Site URLs.');
        }
        
        throw new Error(`Erro ao buscar perfis de prestadores: ${providerError.message}`);
      }

      const servicesPromise = supabase
        .from('services')
        .select('*')
        .in('provider_id', providerIds);

      const { data: services, error: servicesError } = await Promise.race([
        servicesPromise,
        timeoutPromise
      ]) as any;

      if (servicesError) {
        if (servicesError.message.includes('ERR_NAME_NOT_RESOLVED') ||
            servicesError.message.includes('DNS') ||
            servicesError.message.includes('kaspersky')) {
          throw new Error('Kaspersky antivirus is blocking DNS resolution for Supabase. Please configure an exception in your antivirus settings.');
        }
        
        if (servicesError.message.includes('Failed to fetch') || 
            servicesError.message.includes('NetworkError')) {
          throw new Error('CORS configuration issue. Please add http://localhost:5173 to your Supabase project\'s Site URLs.');
        }
        
        throw new Error(`Erro ao buscar serviços: ${servicesError.message}`);
      }

      const providersWithData = userProfiles.map(provider => {
        const providerProfile = providerProfiles?.find(pp => pp.id === provider.id);
        const providerServices = services?.filter(s => s.provider_id === provider.id) || [];

        return {
          ...provider,
          provider_profile: providerProfile || {
            average_rating: 0,
            total_reviews: 0,
            is_verified: false,
            specialties: [],
          },
          services: providerServices,
        };
      });

      setProviders(providersWithData);
      setRetryCount(0);
      
      if (providersWithData.length > 0) {
        showSuccess(`${providersWithData.length} profissionais carregados com sucesso!`);
      }
    } catch (error: any) {
      console.error('Erro ao buscar prestadores:', error);
      
      if (error.message === 'Query timeout') {
        const timeoutError = {
          type: 'kaspersky' as const,
          message: 'Timeout na conexão com o banco de dados',
          suggestion: 'A conexão está muito lenta, provavelmente devido ao antivírus Kaspersky bloqueando a conexão. Configure uma exceção no antivírus.'
        };
        setError(timeoutError);
        showError('Timeout na conexão - verifique seu antivírus');
        return;
      }
      
      const errorDetails = analyzeError(error);
      setError(errorDetails);
      showError('Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchProviders();
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.provider_profile.specialties.some(s => 
                           s.toLowerCase().includes(searchTerm.toLowerCase())
                         ) ||
                         provider.services.some(service =>
                           service.name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesLocation = !selectedLocation || 
                           (provider.city && provider.city.toLowerCase().includes(selectedLocation.toLowerCase())) ||
                           (provider.state && provider.state.toLowerCase().includes(selectedLocation.toLowerCase()));
    
    const matchesSpecialty = !selectedSpecialty || 
                            provider.provider_profile.specialties.includes(selectedSpecialty);

    return matchesSearch && matchesLocation && matchesSpecialty;
  });

  const allSpecialties = Array.from(
    new Set(providers.flatMap(p => p.provider_profile.specialties))
  );

  const allLocations = Array.from(
    new Set(providers.map(p => p.city).filter(Boolean))
  );

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'kaspersky':
        return <Shield className="h-6 w-6 text-red-400" />;
      case 'network':
      case 'cors':
        return <Wifi className="h-6 w-6 text-red-400" />;
      case 'auth':
      case 'schema':
      case 'database':
      case 'config':
        return <AlertCircle className="h-6 w-6 text-red-400" />;
      default:
        return <AlertCircle className="h-6 w-6 text-red-400" />;
    }
  };

  return (
    <div className="main-container">
      <div className="container mx-auto px-4 py-8 space-y-16">
        {/* Hero Section Ultra Moderno */}
        <section className="hero-gradient text-white rounded-3xl p-16 text-center relative overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="animate-float mb-12">
              <div className="flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-yellow-300 mr-3 animate-pulse-slow" />
                <span className="text-yellow-300 font-semibold text-lg">Plataforma Premium</span>
                <Sparkles className="h-8 w-8 text-yellow-300 ml-3 animate-pulse-slow" />
              </div>
              <h1 className="text-7xl font-bold mb-8 leading-tight text-shadow-lg">
                Encontre o <span className="text-gradient bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">profissional ideal</span>
              </h1>
              <p className="text-2xl mb-12 opacity-90 max-w-4xl mx-auto leading-relaxed">
                Conecte-se com prestadores qualificados na sua região. Agende serviços com facilidade, segurança e qualidade garantida.
              </p>
            </div>
            
            {/* Barra de Pesquisa Ultra Moderna */}
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                  <input
                    type="text"
                    placeholder="Buscar profissional ou serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 rounded-2xl text-gray-900 bg-white/95 backdrop-blur-sm border-0 focus:ring-4 focus:ring-white/30 transition-all duration-300 shadow-2xl text-lg font-medium hover:bg-white hover:shadow-3xl"
                  />
                </div>
                
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                  <input
                    type="text"
                    placeholder="Cidade ou estado..."
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 rounded-2xl text-gray-900 bg-white/95 backdrop-blur-sm border-0 focus:ring-4 focus:ring-white/30 transition-all duration-300 shadow-2xl text-lg font-medium hover:bg-white hover:shadow-3xl"
                  />
                </div>
                
                <div className="relative group">
                  <Filter className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full pl-14 pr-10 py-5 rounded-2xl text-gray-900 bg-white/95 backdrop-blur-sm border-0 focus:ring-4 focus:ring-white/30 transition-all duration-300 shadow-2xl text-lg font-medium appearance-none hover:bg-white hover:shadow-3xl"
                  >
                    <option value="">Todas as especialidades</option>
                    {allSpecialties.map(specialty => (
                      <option key={specialty} value={specialty}>{specialty}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-3 text-white/90">
                <Zap className="h-5 w-5 animate-pulse" />
                <p className="text-lg font-medium">
                  Navegue livremente • Faça login apenas para agendar • 100% Seguro
                </p>
                <Heart className="h-5 w-5 animate-pulse text-red-300" />
              </div>
            </div>
          </div>
        </section>

        {/* Error Message Premium */}
        {error && (
          <div className="card bg-red-50/90 border-2 border-red-200/50 animate-slide-up">
            <div className="flex">
              <div className="flex-shrink-0">
                {getErrorIcon(error.type)}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-red-800 mb-3">
                  {error.message}
                </h3>
                <div className="text-red-700">
                  <p className="mb-6 text-lg">{error.suggestion}</p>
                  
                  {error.type === 'kaspersky' && (
                    <div className="bg-red-100/80 rounded-2xl p-6 mb-6">
                      <p className="font-bold text-red-800 mb-4 flex items-center text-lg">
                        <Shield className="h-6 w-6 mr-3" />
                        Como resolver o bloqueio do Kaspersky:
                      </p>
                      <ol className="list-decimal list-inside space-y-3 text-base">
                        <li>Abra o <strong>Kaspersky Internet Security</strong></li>
                        <li>Vá para <strong>Configurações → Proteção → Firewall</strong></li>
                        <li>Clique em <strong>"Configurar regras de aplicativo"</strong></li>
                        <li>Encontre o <strong>Google Chrome</strong> na lista</li>
                        <li>Altere para <strong>"Permitir tudo"</strong></li>
                        <li>Adicione <strong>*.supabase.co</strong> aos sites confiáveis</li>
                      </ol>
                    </div>
                  )}
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={handleRetry}
                      disabled={loading}
                      className="btn btn-danger"
                    >
                      <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? 'Tentando...' : 'Tentar novamente'}
                    </button>
                    
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Painel Supabase
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Profissionais Premium */}
        <section className="animate-fade-in">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-3 text-gradient">
                Profissionais Disponíveis
              </h2>
              <p className="text-xl text-gray-600 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                {filteredProviders.length} profissionais encontrados
              </p>
            </div>
            
            {(searchTerm || selectedLocation || selectedSpecialty) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedLocation('');
                  setSelectedSpecialty('');
                  showInfo('Filtros removidos');
                }}
                className="btn btn-secondary hover-lift"
              >
                <X className="h-5 w-5 mr-2" />
                Limpar filtros
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="text-center">
                <div className="spinner mx-auto mb-6"></div>
                <p className="text-gray-600 text-xl font-medium">Carregando profissionais...</p>
                {retryCount > 0 && (
                  <p className="text-sm text-gray-500 mt-3">
                    Tentativa {retryCount + 1}
                  </p>
                )}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="card max-w-lg mx-auto">
                <div className="mb-6">
                  {getErrorIcon(error.type)}
                </div>
                <p className="text-gray-500 text-xl mb-3 font-medium">
                  Não foi possível carregar os profissionais
                </p>
                <p className="text-gray-400 mb-6">
                  {error.message}
                </p>
                <button
                  onClick={handleRetry}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Tentando...' : 'Tentar novamente'}
                </button>
              </div>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-16">
              <div className="card max-w-lg mx-auto">
                <Search className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                <p className="text-gray-500 text-xl mb-3 font-medium">
                  {searchTerm || selectedLocation || selectedSpecialty 
                    ? 'Nenhum profissional encontrado'
                    : 'Nenhum profissional cadastrado'
                  }
                </p>
                <p className="text-gray-400">
                  Tente ajustar os filtros ou buscar por outros termos
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredProviders.map((provider, index) => (
                <div 
                  key={provider.id} 
                  className="provider-card animate-slide-up hover-glow"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center mr-5 shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <span className="text-white font-bold text-2xl">
                          {provider.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{provider.name}</h3>
                        {provider.provider_profile.is_verified && (
                          <span className="badge badge-success">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verificado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {provider.bio && (
                    <p className="text-gray-600 mb-6 line-clamp-2 leading-relaxed text-base">
                      {provider.bio}
                    </p>
                  )}

                  <div className="space-y-4 mb-8">
                    {(provider.city || provider.state) && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-5 w-5 mr-3 text-blue-500" />
                        <span className="font-medium">
                          {provider.city}{provider.city && provider.state && ', '}{provider.state}
                        </span>
                      </div>
                    )}

                    {provider.provider_profile.total_reviews > 0 && (
                      <div className="flex items-center text-gray-600">
                        <Star className="h-5 w-5 mr-3 text-yellow-500 fill-current" />
                        <span className="font-medium">
                          {provider.provider_profile.average_rating.toFixed(1)} 
                          ({provider.provider_profile.total_reviews} avaliações)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Especialidades */}
                  {provider.provider_profile.specialties.length > 0 && (
                    <div className="mb-8">
                      <div className="flex flex-wrap gap-2">
                        {provider.provider_profile.specialties.slice(0, 3).map((specialty, index) => (
                          <span
                            key={index}
                            className="badge badge-info"
                          >
                            {specialty}
                          </span>
                        ))}
                        {provider.provider_profile.specialties.length > 3 && (
                          <span className="text-gray-500 text-sm px-3 py-1">
                            +{provider.provider_profile.specialties.length - 3} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Serviços */}
                  {provider.services.length > 0 && (
                    <div className="mb-8">
                      <p className="text-base font-bold text-gray-700 mb-4">Serviços:</p>
                      <div className="space-y-3">
                        {provider.services.slice(0, 2).map((service) => (
                          <div key={service.id} className="flex justify-between items-center bg-gray-50/80 rounded-xl p-3 hover:bg-gray-100/80 transition-colors">
                            <span className="text-gray-700 font-medium">{service.name}</span>
                            <span className="text-gray-900 font-bold text-lg">
                              R$ {service.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        {provider.services.length > 2 && (
                          <p className="text-sm text-gray-500 text-center font-medium">
                            +{provider.services.length - 2} serviços disponíveis
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <Link
                    to={`/provider/${provider.id}`}
                    className="w-full btn btn-primary text-center block glow"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Ver Perfil e Agendar
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Features Section Ultra Premium */}
        <section className="section-bg animate-fade-in">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-gradient">
              Por que escolher nossa plataforma?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Oferecemos a melhor experiência em agendamento de serviços com tecnologia de ponta
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="feature-card text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <Calendar className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Agendamento Inteligente</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Navegue sem cadastro e faça login apenas quando quiser agendar. Processo rápido, intuitivo e seguro.
              </p>
            </div>
            
            <div className="feature-card text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Profissionais Premium</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Todos os prestadores passam por verificação rigorosa. Avaliações reais de clientes garantem máxima qualidade.
              </p>
            </div>
            
            <div className="feature-card text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Notificações Inteligentes</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Receba confirmações e lembretes por WhatsApp e e-mail. Sistema inteligente que nunca falha.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action Ultra Premium */}
        <section className="card-glass text-center animate-fade-in glow">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <Users className="h-20 w-20 text-white animate-bounce-slow" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              É um prestador de serviços?
            </h2>
            <p className="text-white/90 mb-10 text-xl leading-relaxed">
              Cadastre-se gratuitamente e receba até <strong>5 agendamentos confirmados</strong> sem custo. 
              Construa sua reputação online, expanda seus negócios e alcance novos clientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link to="/register" className="btn btn-primary glow text-lg px-8 py-4">
                <Users className="h-6 w-6 mr-3" />
                Cadastrar como Prestador
              </Link>
              <div className="flex items-center text-white/80">
                <CheckCircle className="h-5 w-5 mr-2 text-green-300" />
                <span className="font-medium">100% Gratuito para começar</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}