import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Phone, MapPin, Briefcase, FileText, Star, Sparkles, Users, CheckCircle, Award, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ToastNotification';

export function Register() {
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    // Client specific fields
    address: '',
    city: '',
    state: '',
    zip_code: '',
    // Provider specific fields
    bio: '',
    experience: '',
    specialties: [''],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      showError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      showError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (!userType) {
      setError('Selecione o tipo de usuário');
      showError('Selecione o tipo de usuário');
      setLoading(false);
      return;
    }

    // Validações específicas para prestador
    if (userType === 'prestador') {
      if (!formData.bio.trim()) {
        setError('Apresentação pessoal é obrigatória para prestadores');
        showError('Apresentação pessoal é obrigatória para prestadores');
        setLoading(false);
        return;
      }
      
      const validSpecialties = formData.specialties.filter(s => s.trim() !== '');
      if (validSpecialties.length === 0) {
        setError('Adicione pelo menos uma especialidade');
        showError('Adicione pelo menos uma especialidade');
        setLoading(false);
        return;
      }
    }

    try {
      showInfo('Criando sua conta...');
      
      const userData = {
        name: formData.name,
        user_type: userType,
        phone: formData.phone,
        ...(userType === 'cliente' && {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
        }),
        ...(userType === 'prestador' && {
          bio: formData.bio,
          experience: formData.experience,
          specialties: formData.specialties.filter(s => s.trim() !== ''),
        }),
      };

      await signUp(formData.email, formData.password, userData);
      
      showSuccess('Conta criada com sucesso! Bem-vindo(a)!');
      
      // Redirecionar baseado no tipo de usuário
      if (userType === 'prestador') {
        navigate('/services'); // Prestador vai direto para configurar serviços
      } else {
        navigate('/dashboard'); // Cliente vai para dashboard
      }
    } catch (error) {
      // Handle specific error cases
      if (error.code === 'user_already_exists') {
        setError('Este e-mail já está cadastrado. Por favor, faça login.');
        showError('Este e-mail já está cadastrado');
      } else {
        setError(error.message || 'Erro ao criar conta');
        showError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addSpecialty = () => {
    setFormData({
      ...formData,
      specialties: [...formData.specialties, ''],
    });
  };

  const updateSpecialty = (index, value) => {
    const newSpecialties = [...formData.specialties];
    newSpecialties[index] = value;
    setFormData({
      ...formData,
      specialties: newSpecialties,
    });
  };

  const removeSpecialty = (index) => {
    if (formData.specialties.length > 1) {
      setFormData({
        ...formData,
        specialties: formData.specialties.filter((_, i) => i !== index),
      });
    }
  };

  // User type selection screen
  if (!userType) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <div className="flex items-center justify-center mb-8">
              <Sparkles className="h-12 w-12 text-blue-500 mr-4 animate-pulse" />
              <h1 className="text-5xl font-bold text-gradient">Criar conta</h1>
              <Sparkles className="h-12 w-12 text-purple-500 ml-4 animate-pulse" />
            </div>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
              Escolha o tipo de conta que melhor se adequa ao seu perfil
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Cliente Card */}
            <div 
              onClick={() => setUserType('cliente')}
              className="feature-card cursor-pointer hover-glow group animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                  <User className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Sou Cliente</h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Quero contratar serviços de prestadores qualificados
                </p>
                <ul className="text-left space-y-4 text-gray-600 mb-10">
                  <li className="flex items-center text-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                    Buscar e contratar serviços
                  </li>
                  <li className="flex items-center text-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                    Agendar compromissos facilmente
                  </li>
                  <li className="flex items-center text-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                    Avaliar prestadores
                  </li>
                  <li className="flex items-center text-lg">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mr-4 flex-shrink-0" />
                    Gerenciar agendamentos
                  </li>
                </ul>
                <button className="w-full btn btn-success text-lg py-4 glow">
                  <User className="h-6 w-6 mr-3" />
                  Continuar como Cliente
                </button>
              </div>
            </div>

            {/* Prestador Card */}
            <div 
              onClick={() => setUserType('prestador')}
              className="feature-card cursor-pointer hover-glow group animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                  <Briefcase className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Sou Prestador</h2>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Quero oferecer meus serviços e receber agendamentos
                </p>
                <ul className="text-left space-y-4 text-gray-600 mb-10">
                  <li className="flex items-center text-lg">
                    <CheckCircle className="w-6 h-6 text-blue-500 mr-4 flex-shrink-0" />
                    Cadastrar serviços e preços
                  </li>
                  <li className="flex items-center text-lg">
                    <CheckCircle className="w-6 h-6 text-blue-500 mr-4 flex-shrink-0" />
                    Definir horários de atendimento
                  </li>
                  <li className="flex items-center text-lg">
                    <CheckCircle className="w-6 h-6 text-blue-500 mr-4 flex-shrink-0" />
                    Receber até 5 agendamentos grátis
                  </li>
                  <li className="flex items-center text-lg">
                    <CheckCircle className="w-6 h-6 text-blue-500 mr-4 flex-shrink-0" />
                    Construir reputação online
                  </li>
                </ul>
                <button className="w-full btn btn-primary text-lg py-4 glow">
                  <Briefcase className="h-6 w-6 mr-3" />
                  Continuar como Prestador
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <p className="text-gray-600 text-lg">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold transition-colors">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Registration form based on user type
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card animate-fade-in">
          <div className="text-center mb-10">
            <button
              onClick={() => setUserType(null)}
              className="text-blue-600 hover:text-blue-800 mb-6 flex items-center mx-auto font-medium transition-colors"
            >
              ← Voltar para seleção de tipo
            </button>
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              {userType === 'cliente' ? <User className="h-10 w-10 text-white" /> : <Briefcase className="h-10 w-10 text-white" />}
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Cadastro de {userType === 'cliente' ? 'Cliente' : 'Prestador'}
            </h1>
            <p className="text-gray-600 text-lg">
              {userType === 'cliente' 
                ? 'Preencha seus dados para começar a contratar serviços'
                : 'Preencha seus dados para começar a oferecer serviços'
              }
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 animate-slide-up">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-3 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-3">
                  Nome completo *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="input pl-12"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-3">
                  Telefone *
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input pl-12"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-3">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-12"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Client-specific fields */}
            {userType === 'cliente' && (
              <>
                <div>
                  <label htmlFor="address" className="block text-sm font-bold text-gray-700 mb-3">
                    Endereço
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      className="input pl-12"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-bold text-gray-700 mb-3">
                      Cidade
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange}
                      className="input"
                      placeholder="Sua cidade"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-bold text-gray-700 mb-3">
                      Estado
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      value={formData.state}
                      onChange={handleChange}
                      className="input"
                      placeholder="SP"
                    />
                  </div>

                  <div>
                    <label htmlFor="zip_code" className="block text-sm font-bold text-gray-700 mb-3">
                      CEP
                    </label>
                    <input
                      id="zip_code"
                      name="zip_code"
                      type="text"
                      value={formData.zip_code}
                      onChange={handleChange}
                      className="input"
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Provider-specific fields */}
            {userType === 'prestador' && (
              <>
                <div className="card-glass p-6 animate-pulse-slow">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Award className="h-6 w-6 mr-3" />
                    Informações importantes para prestadores:
                  </h3>
                  <ul className="text-white/90 space-y-2">
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                      Após o cadastro, você configurará seus serviços e horários
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                      Receba até 5 agendamentos confirmados gratuitamente
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                      Clientes podem ver seu perfil e solicitar agendamentos
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-5 w-5 mr-3 text-green-300" />
                      Você decide aceitar ou recusar cada solicitação
                    </li>
                  </ul>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-bold text-gray-700 mb-3">
                    Apresentação pessoal *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="input pl-12"
                      placeholder="Conte um pouco sobre você, sua experiência e o que oferece. Esta informação será exibida no seu perfil público."
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Esta descrição ajudará os clientes a conhecerem melhor seu trabalho
                  </p>
                </div>

                <div>
                  <label htmlFor="experience" className="block text-sm font-bold text-gray-700 mb-3">
                    Experiência profissional
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                    <textarea
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      rows={3}
                      className="input pl-12"
                      placeholder="Descreva sua experiência, formação, certificações e tempo de atuação na área..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Especialidades *
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    Adicione suas principais especialidades para que os clientes possam encontrá-lo mais facilmente
                  </p>
                  <div className="space-y-3">
                    {formData.specialties.map((specialty, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="relative flex-1">
                          <Star className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={specialty}
                            onChange={(e) => updateSpecialty(index, e.target.value)}
                            className="input pl-12"
                            placeholder="Ex: Corte de cabelo, Manicure, Consultoria..."
                          />
                        </div>
                        {formData.specialties.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSpecialty(index)}
                            className="text-red-600 hover:text-red-800 p-3 rounded-xl hover:bg-red-50 transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSpecialty}
                      className="btn btn-secondary"
                    >
                      <Star className="h-5 w-5 mr-2" />
                      Adicionar Especialidade
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Password fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-3">
                  Senha *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="input pl-12 pr-12"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-3">
                  Confirmar senha *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pl-12"
                    placeholder="Confirme sua senha"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary text-xl py-5 glow"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner-sm mr-3"></div>
                  Criando conta...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Sparkles className="h-6 w-6 mr-3" />
                  Criar conta de {userType}
                </div>
              )}
            </button>

            {userType === 'prestador' && (
              <div className="card-glass p-6 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-yellow-300 animate-pulse" />
                </div>
                <p className="text-white text-lg font-medium">
                  🎉 Após criar sua conta, você será direcionado para configurar seus serviços e horários de atendimento
                </p>
              </div>
            )}
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-600 text-lg">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold transition-colors">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}