import React, { useEffect, useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function ProviderDashboard() {
  const { user } = useAuth();
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchConfirmedCount();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services (
            name,
            duration,
            price
          )
        `)
        .eq('provider_id', user?.id)
        .eq('status', 'pending')
        .order('date', { ascending: true });

      if (error) throw error;

      // Fetch client profiles separately
      const appointmentsWithProfiles = await Promise.all(
        (data || []).map(async (appointment) => {
          const { data: clientProfile } = await supabase
            .from('user_profiles')
            .select('name, phone')
            .eq('id', appointment.client_id)
            .single();

          return {
            ...appointment,
            client_profiles: clientProfile || { name: 'N/A', phone: 'N/A' }
          };
        })
      );

      setPendingAppointments(appointmentsWithProfiles);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfirmedCount = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id')
        .eq('provider_id', user?.id)
        .eq('status', 'confirmed');

      if (error) throw error;
      setConfirmedCount(data?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar contagem de confirmados:', error);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    setProcessingId(appointmentId);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // Mock de notificação
      const appointment = pendingAppointments.find(a => a.id === appointmentId);
      if (appointment) {
        console.log(`📱 Notificação enviada para ${appointment.client_profiles.name} via WhatsApp/Email:`);
        console.log(`Seu agendamento foi ${status === 'confirmed' ? 'CONFIRMADO' : 'REJEITADO'}`);
        console.log(`Serviço: ${appointment.services.name}`);
        console.log(`Data: ${format(new Date(appointment.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`);
      }

      // Atualizar listas locais
      setPendingAppointments(prev => prev.filter(a => a.id !== appointmentId));
      
      if (status === 'confirmed') {
        setConfirmedCount(prev => prev + 1);
      }

      // Verificar se atingiu o limite de 5 agendamentos
      if (status === 'confirmed' && confirmedCount + 1 >= 5) {
        alert('Você atingiu o limite de 5 agendamentos confirmados. Novos agendamentos serão bloqueados automaticamente.');
      }

    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      alert('Erro ao atualizar agendamento. Tente novamente.');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const isAtLimit = confirmedCount >= 5;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Painel do Prestador</h1>
        <p className="text-gray-600 mt-2">
          Gerencie seus agendamentos pendentes
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Agendamentos Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{pendingAppointments.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Agendamentos Confirmados</p>
              <p className="text-2xl font-bold text-gray-900">{confirmedCount}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className={`text-lg font-semibold ${isAtLimit ? 'text-red-600' : 'text-green-600'}`}>
                {isAtLimit ? 'Limite Atingido' : 'Aceitando Agendamentos'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Limit Warning */}
      {isAtLimit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-red-800 font-medium">
                Limite de agendamentos atingido
              </p>
              <p className="text-red-700 text-sm mt-1">
                Você tem 5 agendamentos confirmados. Novos clientes verão a mensagem: 
                "Este profissional não está aceitando novos agendamentos no momento."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Appointments */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Agendamentos Pendentes ({pendingAppointments.length})
        </h2>

        {pendingAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum agendamento pendente</p>
            <p className="text-gray-400 text-sm mt-2">
              Novos agendamentos aparecerão aqui para você aceitar ou recusar
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAppointments.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {appointment.services.name}
                      </h3>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                        Pendente
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          {format(new Date(appointment.date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>
                          {format(new Date(appointment.date), 'HH:mm', { locale: ptBR })} 
                          ({appointment.services.duration} min)
                        </span>
                      </div>

                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span>{appointment.client_profiles.name}</span>
                      </div>

                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{appointment.client_profiles.phone || 'Não informado'}</span>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-gray-600">
                      <span className="font-medium">Valor: R$ {appointment.services.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-4 lg:mt-0">
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                      disabled={processingId === appointment.id}
                      className="btn btn-primary flex items-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {processingId === appointment.id ? 'Confirmando...' : 'Aceitar'}
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'rejected')}
                      disabled={processingId === appointment.id}
                      className="btn btn-secondary flex items-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {processingId === appointment.id ? 'Rejeitando...' : 'Recusar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Como funciona o sistema de agendamentos
        </h3>
        <ul className="text-blue-800 space-y-2 text-sm">
          <li>• Clientes fazem solicitações de agendamento que aparecem aqui</li>
          <li>• Você pode aceitar ou recusar cada solicitação</li>
          <li>• Após 5 agendamentos confirmados, novos agendamentos são bloqueados automaticamente</li>
          <li>• Clientes e você recebem notificações por WhatsApp/Email sobre mudanças de status</li>
          <li>• Agendamentos rejeitados ou cancelados não contam para o limite</li>
        </ul>
      </div>
    </div>
  );
}