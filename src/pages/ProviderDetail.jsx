import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Star, MapPin, Phone, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function ProviderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [provider, setProvider] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [acceptingBookings, setAcceptingBookings] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProvider();
    }
  }, [id]);

  useEffect(() => {
    if (provider && selectedDate) {
      generateTimeSlots();
      checkBookingLimit();
    }
  }, [provider, selectedDate]);

  const fetchProvider = async () => {
    try {
      // Buscar perfil do usuário
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .eq('user_type', 'prestador')
        .single();

      if (userError) throw userError;

      // Buscar perfil do prestador
      const { data: providerProfile, error: providerError } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (providerError) throw providerError;

      // Buscar serviços
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', id);

      if (servicesError) throw servicesError;

      // Buscar horários disponíveis
      const { data: availableTimes, error: timesError } = await supabase
        .from('available_times')
        .select('*')
        .eq('provider_id', id);

      if (timesError) throw timesError;

      setProvider({
        ...userProfile,
        provider_profile: providerProfile,
        services: services || [],
        available_times: availableTimes || [],
      });
    } catch (error) {
      console.error('Erro ao buscar prestador:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBookingLimit = async () => {
    try {
      // Verificar quantos agendamentos confirmados o prestador tem
      const { data: confirmedAppointments, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('provider_id', id)
        .eq('status', 'confirmed');

      if (error) throw error;

      // Se tem 5 ou mais agendamentos confirmados, não aceita mais
      setAcceptingBookings((confirmedAppointments?.length || 0) < 5);
    } catch (error) {
      console.error('Erro ao verificar limite de agendamentos:', error);
    }
  };

  const generateTimeSlots = async () => {
    if (!provider) return;

    const dayOfWeek = selectedDate.getDay();
    const availableTime = provider.available_times.find(at => at.day_of_week === dayOfWeek);

    if (!availableTime) {
      setAvailableSlots([]);
      return;
    }

    // Gerar slots de 30 em 30 minutos
    const slots = [];
    const startTime = new Date(`2000-01-01T${availableTime.start_time}`);
    const endTime = new Date(`2000-01-01T${availableTime.end_time}`);

    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const timeString = format(currentTime, 'HH:mm');
      
      // Verificar se o horário já está ocupado
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('provider_id', id)
        .eq('date', format(selectedDate, 'yyyy-MM-dd') + 'T' + timeString + ':00')
        .neq('status', 'cancelled')
        .neq('status', 'rejected');

      slots.push({
        time: timeString,
        available: !existingAppointments || existingAppointments.length === 0,
      });

      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }

    setAvailableSlots(slots);
  };

  const handleBookingAttempt = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    handleBooking();
  };

  const handleBooking = async () => {
    if (!user || !selectedService || !selectedTime) return;

    setBooking(true);
    try {
      // Verificar se o usuário é cliente
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (userProfile?.user_type !== 'cliente') {
        alert('Apenas clientes podem fazer agendamentos');
        return;
      }

      // Criar agendamento
      const appointmentDate = format(selectedDate, 'yyyy-MM-dd') + 'T' + selectedTime + ':00';
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          provider_id: id,
          client_id: user.id,
          service_id: selectedService,
          date: appointmentDate,
          status: 'pending',
        });

      if (error) throw error;

      // Mock de notificação para o prestador
      console.log('📱 NOTIFICAÇÃO ENVIADA PARA O PRESTADOR:');
      console.log(`WhatsApp/Email: Novo agendamento solicitado!`);
      console.log(`Cliente: ${user.email}`);
      console.log(`Serviço: ${provider?.services.find(s => s.id === selectedService)?.name}`);
      console.log(`Data: ${format(selectedDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}`);
      
      alert('✅ Agendamento solicitado com sucesso!\n\nO prestador foi notificado e você receberá uma confirmação em breve.');
      
      // Resetar formulário
      setSelectedService('');
      setSelectedTime('');
      generateTimeSlots(); // Atualizar slots disponíveis
      
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      alert('Erro ao criar agendamento. Tente novamente.');
    } finally {
      setBooking(false);
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Prestador não encontrado</p>
      </div>
    );
  }

  const selectedServiceData = provider.services.find(s => s.id === selectedService);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Provider Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-bold text-2xl">
              {provider.name.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
              {provider.provider_profile.is_verified && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Verificado
                </span>
              )}
            </div>

            {provider.bio && (
              <p className="text-gray-600 mb-4">{provider.bio}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {(provider.city || provider.state) && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{provider.city}{provider.city && provider.state && ', '}{provider.state}</span>
                </div>
              )}

              {provider.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{provider.phone}</span>
                </div>
              )}

              {provider.provider_profile.total_reviews > 0 && (
                <div className="flex items-center text-gray-600">
                  <Star className="h-4 w-4 mr-2 text-yellow-500" />
                  <span>
                    {provider.provider_profile.average_rating.toFixed(1)} 
                    ({provider.provider_profile.total_reviews} avaliações)
                  </span>
                </div>
              )}
            </div>

            {/* Especialidades */}
            {provider.provider_profile.specialties.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Especialidades:</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.provider_profile.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experiência */}
            {provider.provider_profile.experience && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Experiência:</h3>
                <p className="text-gray-600 text-sm">{provider.provider_profile.experience}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Status - Mensagem discreta conforme especificado */}
      {!acceptingBookings && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
            <p className="text-amber-800">
              Este profissional não está aceitando novos agendamentos no momento.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Services */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Serviços</h2>
          {provider.services.length === 0 ? (
            <p className="text-gray-500">Nenhum serviço cadastrado</p>
          ) : (
            <div className="space-y-3">
              {provider.services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => acceptingBookings && setSelectedService(service.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedService === service.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!acceptingBookings ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{service.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{service.duration} minutos</span>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calendar and Time Slots */}
        {acceptingBookings && selectedService && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Agendar Horário</h2>
            
            {/* Date Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Selecione o dia:</h3>
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((day) => (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    disabled={isBefore(day, new Date()) && !isSameDay(day, new Date())}
                    className={`p-2 text-sm rounded-lg transition-colors ${
                      isSameDay(selectedDate, day)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${
                      isBefore(day, new Date()) && !isSameDay(day, new Date())
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <div className="text-xs">{format(day, 'EEE', { locale: ptBR })}</div>
                    <div className="font-medium">{format(day, 'd')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Horários disponíveis para {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}:
              </h3>
              {availableSlots.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum horário disponível neste dia</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`p-2 text-sm rounded-lg transition-colors ${
                        selectedTime === slot.time
                          ? 'bg-primary-600 text-white'
                          : slot.available
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Booking Summary */}
            {selectedServiceData && selectedTime && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Resumo do agendamento:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Serviço:</strong> {selectedServiceData.name}</p>
                  <p><strong>Data:</strong> {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}</p>
                  <p><strong>Horário:</strong> {selectedTime}</p>
                  <p><strong>Duração:</strong> {selectedServiceData.duration} minutos</p>
                  <p><strong>Valor:</strong> R$ {selectedServiceData.price.toFixed(2)}</p>
                </div>
              </div>
            )}

            {/* Book Button */}
            <button
              onClick={handleBookingAttempt}
              disabled={!selectedService || !selectedTime || booking}
              className="w-full btn btn-primary"
            >
              {booking ? 'Agendando...' : 'Solicitar Agendamento'}
            </button>
          </div>
        )}
      </div>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Login necessário para agendar
            </h3>
            <p className="text-gray-600 mb-6">
              Para solicitar um agendamento, você precisa fazer login ou criar uma conta.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 btn btn-primary"
              >
                Fazer Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex-1 btn btn-secondary"
              >
                Criar Conta
              </button>
            </div>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="w-full mt-3 text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}