import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    bio: '',
    experience: '',
    specialties: [],
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      // Fetch user profile
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;
      setProfile(userProfile);

      let providerData = null;

      // If user is a provider, fetch provider profile
      if (userProfile.user_type === 'prestador') {
        const { data: providerProfileData, error: providerError } = await supabase
          .from('provider_profiles')
          .select('*')
          .eq('id', user?.id)
          .single();

        if (providerError && providerError.code !== 'PGRST116') {
          throw providerError;
        }
        providerData = providerProfileData;
        setProviderProfile(providerData);
      }

      // Set form data
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        zip_code: userProfile.zip_code || '',
        bio: userProfile.bio || '',
        experience: providerData?.experience || '',
        specialties: providerData?.specialties || [],
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update user profile
      const { error: userError } = await supabase
        .from('user_profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          bio: formData.bio,
        })
        .eq('id', user?.id);

      if (userError) throw userError;

      // Update provider profile if user is a provider
      if (profile?.user_type === 'prestador') {
        const { error: providerError } = await supabase
          .from('provider_profiles')
          .upsert({
            id: user?.id,
            experience: formData.experience,
            specialties: formData.specialties,
          });

        if (providerError) throw providerError;
      }

      await fetchProfile();
      setEditing(false);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      zip_code: profile?.zip_code || '',
      bio: profile?.bio || '',
      experience: providerProfile?.experience || '',
      specialties: providerProfile?.specialties || [],
    });
    setEditing(false);
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
    setFormData({
      ...formData,
      specialties: formData.specialties.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-2">Gerencie suas informações pessoais</p>
        </div>
        
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="btn btn-primary flex items-center"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={handleCancel}
              className="btn btn-secondary flex items-center"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.name || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-gray-900">{user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.phone || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de usuário
                </label>
                <p className="text-gray-900 capitalize">{profile?.user_type}</p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.address || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.city || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.state || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                {editing ? (
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleChange}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{profile?.zip_code || 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biografia
            </label>
            {editing ? (
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                className="input"
                placeholder="Conte um pouco sobre você..."
              />
            ) : (
              <p className="text-gray-900">{profile?.bio || 'Não informado'}</p>
            )}
          </div>

          {/* Provider-specific fields */}
          {profile?.user_type === 'prestador' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experiência
                </label>
                {editing ? (
                  <textarea
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    rows={3}
                    className="input"
                    placeholder="Descreva sua experiência profissional..."
                  />
                ) : (
                  <p className="text-gray-900">{providerProfile?.experience || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Especialidades
                </label>
                {editing ? (
                  <div className="space-y-2">
                    {formData.specialties.map((specialty, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={specialty}
                          onChange={(e) => updateSpecialty(index, e.target.value)}
                          className="input flex-1"
                          placeholder="Digite uma especialidade"
                        />
                        <button
                          type="button"
                          onClick={() => removeSpecialty(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addSpecialty}
                      className="btn btn-secondary text-sm"
                    >
                      Adicionar Especialidade
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {providerProfile?.specialties?.length > 0 ? (
                      providerProfile.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm"
                        >
                          {specialty}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-900">Nenhuma especialidade informada</p>
                    )}
                  </div>
                )}
              </div>

              {providerProfile && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {providerProfile.average_rating.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Avaliação média</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {providerProfile.total_reviews}
                    </p>
                    <p className="text-sm text-gray-600">Total de avaliações</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {providerProfile.is_verified ? 'Sim' : 'Não'}
                    </p>
                    <p className="text-sm text-gray-600">Verificado</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}