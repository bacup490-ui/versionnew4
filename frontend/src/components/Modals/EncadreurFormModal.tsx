import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Building2 } from 'lucide-react';
import { encadreurService } from '../../services/encadreurService';
import { authService } from '../../services/authService';
import { useApiError } from '../../hooks/useApiError';
import { validateName, validatePhone, validateEmail } from '../../utils/validation';

interface EncadreurFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  encadreurId: number | null;
}

export default function EncadreurFormModal({ isOpen, onClose, encadreurId }: EncadreurFormModalProps) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    departement: '',
    specialization: '',
  });
  const [errors, setErrors] = useState({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    departement: '',
  });
  const [loading, setLoading] = useState(false);
  const handleApiError = useApiError();

  useEffect(() => {
    if (isOpen && encadreurId) {
      loadEncadreur();
    } else if (isOpen) {
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        phone: '',
        departement: '',
        specialization: '',
      });
      setErrors({
        nom: '',
        prenom: '',
        email: '',
        phone: '',
        departement: '',
      });
    }
  }, [encadreurId, isOpen]);

  const loadEncadreur = async () => {
    if (!encadreurId) return;
    try {
      setLoading(true);
      const encadreur = await encadreurService.getEncadreurById(encadreurId);
      setFormData({
        nom: encadreur.nom,
        prenom: encadreur.prenom,
        email: encadreur.email,
        phone: encadreur.phone,
        departement: encadreur.department,
        specialization: '',
      });
    } catch (error: any) {
      handleApiError(error, 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name: string, value: string) => {
    let error = '';

    switch (name) {
      case 'prenom':
        error = validateName(value, 'Le prénom') || '';
        break;
      case 'nom':
        error = validateName(value, 'Le nom') || '';
        break;
      case 'email':
        error = validateEmail(value) || '';
        break;
      case 'phone':
        error = validatePhone(value) || '';
        break;
      case 'departement':
        if (!value) error = 'Le département est requis';
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const validateForm = () => {
    const fields = ['nom', 'prenom', 'email', 'phone', 'departement'];
    let isValid = true;

    fields.forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (!validateField(field, value)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      if (encadreurId) {
        await encadreurService.updateEncadreur(encadreurId, {
          nom: formData.nom,
          prenom: formData.prenom,
          phone: formData.phone,
          department: formData.departement
        });
      } else {
        await authService.createEncadreur({
          email: formData.email,
          nom: formData.nom,
          prenom: formData.prenom,
          phone: formData.phone,
          departement: formData.departement,
          specialization: formData.specialization
        });
      }
      onClose();
    } catch (error: any) {
      handleApiError(error, encadreurId ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50  backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <User className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {encadreurId ? 'Modifier l\'Encadreur' : 'Ajouter un Encadreur'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prénom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => handleChange('prenom', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.prenom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Jean"
                  />
                </div>
                <div className="h-5 mt-1">
                  {errors.prenom && (
                    <p className="text-red-500 text-sm">{errors.prenom}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => handleChange('nom', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      errors.nom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Dupont"
                  />
                </div>
                <div className="h-5 mt-1">
                  {errors.nom && (
                    <p className="text-red-500 text-sm">{errors.nom}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  required={!encadreurId}
                  readOnly={!!encadreurId}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } ${encadreurId ? 'cursor-not-allowed opacity-60' : ''}`}
                  placeholder="jean.dupont@company.com"
                />
              </div>
              <div className="h-5 mt-1">
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
              {encadreurId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  L'email ne peut pas être modifié
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone *
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                  +261
                </span>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    const onlyDigits = e.target.value.replace(/\D/g, '');
                    handleChange('phone', onlyDigits);
                  }}
                  maxLength={9}
                  className={`w-full px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Ex: 321234567"
                />
              </div>
              <div className="h-5 mt-1">
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Département *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  required
                  value={formData.departement}
                  onChange={(e) => handleChange('departement', e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.departement ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Sélectionner un département</option>
                  <option value="Informatique">Informatique</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Ressources Humaines">Ressources Humaines</option>
                  <option value="Finance">Finance</option>
                  <option value="Ventes">Ventes</option>
                  <option value="Support">Support</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Spécialisation
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Développement Web, Data Science..."
              />
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                <strong>Note:</strong> Les encadreurs auront accès à la gestion des stagiaires qui leur sont assignés et pourront suivre leurs progressions.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Enregistrement...' : (encadreurId ? 'Mettre à jour' : 'Ajouter')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
