import React, { useEffect, useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export function Appointments() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserProfile();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (userProfile && user) {
      fetchAppointments();
    }
  }, [userProfile, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const fetchAppointments = async () => {
    if (!user || !userProfile) return;
    
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          services (
            name,
            duration,
            price
          ),
          client_profiles:profiles!appointments_client_id_fkey (
            user_type
          ),
          provider_profiles:profiles!appointments_provider_id_fkey (
            user_type
          )
        `);

      if (userProfile.user_type === 'prestador') {
        query = query.eq('provider_id', user.id);
      } else {
        query = query.eq('client_id', user.id);
      }

      const { data: appointmentsData, error } = await query.order('date', { ascending: true });

      if (error) throw error;

      // Now fetch user_profiles data separately for each appointment
      const appointmentsWithProfiles = await Promise.all(
        (appointmentsData || []).map(async (appointment) => {
          const [clientProfile, providerProfile] = await Promise.all([
            supabase
              .from('user_profiles')
              .select('name, phone')
              .eq('id', appointment.client_id)
              .single(),
            supabase
              .from('user_profiles')
              .select('name, phone')
              .eq('id', appointment.provider_id)
              .single()
          ]);

          return {
            ...appointment,
            client_profiles: clientProfile.data || { name: 'N/A', phone: 'N/A' },
            provider_profiles: providerProfile.data || { name: 'N/A', phone: 'N/A' }
          };
        })
      );

      setAppointments(appointmentsWithProfiles);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments(appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, status: status } : apt
      ));
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmado';
      case 'rejected':
        return 'Rejeitado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Você precisa estar logado para acessar esta página</p>
        <Link to="/login" className="btn btn-primary mt-4">
          Fazer Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meus Agendamentos</h1>
        <p className="text-gray-600 mt-2">
          {userProfile?.user_type === 'prestador' 
            ? 'Gerencie os agendamentos dos seus clientes'
            : 'Acompanhe seus agendamentos'
          }
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 mr-3">
                      {appointment.services.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
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
                      <span>
                        {userProfile?.user_type === 'prestador' 
                          ? appointment.client_profiles.name
                          : appointment.provider_profiles.name
                        }
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Valor: R$ {appointment.services.price.toFixed(2)}</span>
                  </div>
                </div>

                {userProfile?.user_type === 'prestador' && appointment.status === 'pending' && (
                  <div className="flex space-x-2 mt-4 md:mt-0">
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                      className="btn btn-primary text-sm"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'rejected')}
                      className="btn btn-secondary text-sm"
                    >
                      Rejeitar
                    </button>
                  </div>
                )}

                {userProfile?.user_type === 'cliente' && appointment.status === 'pending' && (
                  <div className="mt-4 md:mt-0">
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      className="btn btn-secondary text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}