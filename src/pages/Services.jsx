import React, { useEffect, useState } from 'react';
import { Clock, DollarSign, Plus, Edit2, Trash2, Save, X, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export function Services() {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({ name: '', duration: 30, price: 0 });
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' },
  ];

  useEffect(() => {
    if (user && !authLoading) {
      fetchUserProfile();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (userProfile?.user_type === 'prestador' && user) {
      fetchServices();
      fetchAvailableTimes();
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

  const fetchServices = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', user.id)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTimes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('available_times')
        .select('*')
        .eq('provider_id', user.id)
        .order('day_of_week');

      if (error) throw error;
      setAvailableTimes(data || []);
    } catch (error) {
      console.error('Erro ao buscar horários:', error);
    }
  };

  const handleCreateService = async () => {
    if (!newService.name || newService.price <= 0 || !user) {
      alert('Preencha todos os campos corretamente');
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .insert({
          provider_id: user.id,
          name: newService.name,
          duration: newService.duration,
          price: newService.price,
        });

      if (error) throw error;

      setNewService({ name: '', duration: 30, price: 0 });
      setShowNewServiceForm(false);
      fetchServices();
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      alert('Erro ao criar serviço');
    }
  };

  const handleUpdateService = async (serviceId, updatedData) => {
    try {
      const { error } = await supabase
        .from('services')
        .update(updatedData)
        .eq('id', serviceId);

      if (error) throw error;

      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      alert('Erro ao atualizar serviço');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      alert('Erro ao excluir serviço');
    }
  };

  const handleUpdateAvailableTime = async (dayOfWeek, startTime, endTime) => {
    if (!user) return;
    
    try {
      const existingTime = availableTimes.find(at => at.day_of_week === dayOfWeek);

      if (existingTime) {
        if (!startTime && !endTime) {
          // Remove if both times are empty
          const { error } = await supabase
            .from('available_times')
            .delete()
            .eq('id', existingTime.id);

          if (error) throw error;
        } else {
          // Update existing
          const { error } = await supabase
            .from('available_times')
            .update({
              start_time: startTime,
              end_time: endTime,
            })
            .eq('id', existingTime.id);

          if (error) throw error;
        }
      } else if (startTime && endTime) {
        // Create new
        const { error } = await supabase
          .from('available_times')
          .insert({
            provider_id: user.id,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
          });

        if (error) throw error;
      }

      fetchAvailableTimes();
    } catch (error) {
      console.error('Erro ao atualizar horário:', error);
      alert('Erro ao atualizar horário');
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

  if (userProfile?.user_type !== 'prestador') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Esta página é apenas para prestadores de serviços</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuração do Prestador</h1>
        <p className="text-gray-600 mt-2">
          Configure seus serviços, preços e horários de atendimento
        </p>
      </div>

      {/* Services Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Meus Serviços</h2>
            <p className="text-gray-600 text-sm mt-1">
              Cadastre os serviços que você oferece com preços e duração
            </p>
          </div>
          <button
            onClick={() => setShowNewServiceForm(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </button>
        </div>

        {/* New Service Form */}
        {showNewServiceForm && (
          <div className="bg-primary-50 border border-primary-200 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cadastrar Novo Serviço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do serviço *
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="input"
                  placeholder="Ex: Corte de cabelo masculino"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duração (minutos) *
                </label>
                <select
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                  className="input"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1h 30min</option>
                  <option value={120}>2 horas</option>
                  <option value={180}>3 horas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) })}
                  className="input"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex space-x-2 mt-4">
              <button onClick={handleCreateService} className="btn btn-primary">
                <Save className="h-4 w-4 mr-2" />
                Salvar Serviço
              </button>
              <button
                onClick={() => {
                  setShowNewServiceForm(false);
                  setNewService({ name: '', duration: 30, price: 0 });
                }}
                className="btn btn-secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Services List */}
        {services.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Nenhum serviço cadastrado</p>
            <p className="text-gray-400 text-sm">
              Cadastre seus serviços para que os clientes possam fazer agendamentos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {editingService === service.id ? (
                  <EditServiceForm
                    service={service}
                    onSave={(updatedData) => handleUpdateService(service.id, updatedData)}
                    onCancel={() => setEditingService(null)}
                  />
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                      <div className="flex items-center space-x-6 text-sm text-gray-600 mt-2">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-primary-600" />
                          <span>{service.duration} minutos</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                          <span className="font-medium">R$ {service.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingService(service.id)}
                        className="text-primary-600 hover:text-primary-800 p-2 rounded-lg hover:bg-primary-50"
                        title="Editar serviço"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                        title="Excluir serviço"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Times Section */}
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary-600" />
            Grade de Horários de Atendimento
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Defina os dias da semana e horários em que você está disponível para atendimento
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Como funciona:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Configure os horários para cada dia da semana</li>
            <li>• Os clientes só poderão agendar nos horários que você definir</li>
            <li>• Deixe em branco os dias que não atende</li>
            <li>• Os agendamentos são feitos em slots de 30 minutos</li>
          </ul>
        </div>

        <div className="space-y-4">
          {daysOfWeek.map((day) => {
            const existingTime = availableTimes.find(at => at.day_of_week === day.value);
            return (
              <AvailableTimeRow
                key={day.value}
                day={day}
                existingTime={existingTime}
                onUpdate={(startTime, endTime) => handleUpdateAvailableTime(day.value, startTime, endTime)}
              />
            );
          })}
        </div>

        {availableTimes.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg mt-6">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum horário configurado</p>
            <p className="text-gray-400 text-sm">Configure seus horários de atendimento acima</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {(services.length > 0 || availableTimes.length > 0) && (
        <div className="card bg-green-50 border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            ✅ Configuração do seu perfil
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-green-800">
            <div>
              <p className="font-medium">Serviços cadastrados:</p>
              <p className="text-2xl font-bold">{services.length}</p>
            </div>
            <div>
              <p className="font-medium">Dias com horários definidos:</p>
              <p className="text-2xl font-bold">{availableTimes.length}</p>
            </div>
          </div>
          {services.length > 0 && availableTimes.length > 0 && (
            <p className="text-green-700 mt-3 text-sm">
              🎉 Perfeito! Seu perfil está configurado e você já pode receber agendamentos!
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Component for editing service
function EditServiceForm({ service, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: service.name,
    duration: service.duration,
    price: service.price,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
            className="input"
          >
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={45}>45 minutos</option>
            <option value={60}>1 hora</option>
            <option value={90}>1h 30min</option>
            <option value={120}>2 horas</option>
            <option value={180}>3 horas</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            className="input"
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onSave(formData)}
          className="btn btn-primary"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="btn btn-secondary"
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Component for available time row
function AvailableTimeRow({ day, existingTime, onUpdate }) {
  const [startTime, setStartTime] = useState(existingTime?.start_time || '');
  const [endTime, setEndTime] = useState(existingTime?.end_time || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleStartTimeChange = (value) => {
    setStartTime(value);
    setHasChanges(true);
  };

  const handleEndTimeChange = (value) => {
    setEndTime(value);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (startTime && endTime && startTime >= endTime) {
      alert('Horário de início deve ser menor que o horário de fim');
      return;
    }
    onUpdate(startTime, endTime);
    setHasChanges(false);
  };

  const isWorking = startTime && endTime;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-4 rounded-lg border ${
      isWorking ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="md:col-span-1">
        <label className="text-sm font-medium text-gray-700 flex items-center">
          {isWorking && <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>}
          {day.label}
        </label>
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Início</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => handleStartTimeChange(e.target.value)}
          className="input"
        />
      </div>
      
      <div>
        <label className="block text-xs text-gray-500 mb-1">Fim</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => handleEndTimeChange(e.target.value)}
          className="input"
        />
      </div>
      
      <div>
        {isWorking && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">
              {Math.floor((new Date(`2000-01-01T${endTime}`) - new Date(`2000-01-01T${startTime}`)) / (1000 * 60 * 60))}h
              {Math.floor(((new Date(`2000-01-01T${endTime}`) - new Date(`2000-01-01T${startTime}`)) % (1000 * 60 * 60)) / (1000 * 60))}min
            </span>
            <br />
            <span className="text-gray-500">de atendimento</span>
          </div>
        )}
      </div>
      
      <div>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`btn w-full ${hasChanges ? 'btn-primary' : 'btn-secondary'}`}
        >
          {hasChanges ? 'Salvar' : 'Salvo'}
        </button>
      </div>
    </div>
  );
}