import React, { useState, useEffect, useRef } from 'react';
import {
  X, Users, Lock, Bell, Book, Save, Camera, KeyRound,
  Edit3, Eye, Calendar, FileText, Upload, Download, Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService, UpdateProfileRequest } from '../../services/userService';
import { validateName, validatePhone } from '../../utils/validation';
import ConfirmModal from './ConfirmModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'users' | 'security' | 'notifications' | 'documentation' | null;
}

export default function SettingsModal({ isOpen, onClose, type }: SettingsModalProps) {
  const { authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    phone: '',
    departement: '',
    email: '',
    dateNaissance: '',
    cvPath: '',
  });

  const [validationErrors, setValidationErrors] = useState({
    nom: '',
    prenom: '',
    phone: '',
  });

  const [avatar, setAvatar] = useState<string>('');
  const [tempAvatar, setTempAvatar] = useState<string>('');
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (isOpen && authUser) {
      loadUserProfile();
    }
  }, [isOpen, authUser]);

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getCurrentProfile();
      setFormData({
        nom: profile.nom || '',
        prenom: profile.prenom || '',
        phone: profile.phone || '',
        department: profile.department || '',
        email: profile.email || '',
        dateNaissance: profile.dateNaissance || '',
        cvPath: profile.cvPath || '',
      });

      setAvatar(profile.avatar || `https://ui-avatars.com/api/?name=${profile.prenom}+${profile.nom}&background=random`);
    } catch (err) {
      console.error('Erreur de chargement du profil:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    let error = '';
    if (name === 'nom') {
      error = validateName(value, 'Le nom') || '';
    } else if (name === 'prenom') {
      error = validateName(value, 'Le prénom') || '';
    } else if (name === 'phone') {
      error = validatePhone(value) || '';
    }

    if (name === 'nom' || name === 'prenom' || name === 'phone') {
      setValidationErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Le fichier doit être une image');
        setTimeout(() => setError(null), 3000);
        return;
      }

      setPendingAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setTempAvatar(objectUrl);
    }
  };

  const handleSaveAvatar = async () => {
    if (!pendingAvatarFile) return;

    try {
      setLoading(true);
      setError(null);

      const avatarUrl = await userService.uploadAvatar(pendingAvatarFile);
      const fullAvatarUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${avatarUrl}`;
      setAvatar(fullAvatarUrl);

      await userService.updateProfile({ avatar: avatarUrl });

      setPendingAvatarFile(null);
      if (tempAvatar) {
        URL.revokeObjectURL(tempAvatar);
        setTempAvatar('');
      }

      setSuccess('Photo de profil mise à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour de la photo');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAvatar = () => {
    setPendingAvatarFile(null);
    if (tempAvatar) {
      URL.revokeObjectURL(tempAvatar);
      setTempAvatar('');
    }
  };
  const handleCVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Seuls les fichiers PDF sont acceptés');
        setTimeout(() => setError(null), 3000);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const cvPath = await userService.uploadCV(file);
        setFormData(prev => ({ ...prev, cvPath }));

        setSuccess('CV uploadé avec succès');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de l\'upload du CV');
        setTimeout(() => setError(null), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    const nomError = validateName(formData.nom, 'Le nom') || '';
    const prenomError = validateName(formData.prenom, 'Le prénom') || '';
    const phoneError = formData.phone ? validatePhone(formData.phone) || '' : '';

    setValidationErrors({
      nom: nomError,
      prenom: prenomError,
      phone: phoneError,
    });

    if (nomError || prenomError || phoneError) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updateData: UpdateProfileRequest = {
        nom: formData.nom,
        prenom: formData.prenom,
        phone: formData.phone,
        department: formData.department,
        dateNaissance: formData.dateNaissance,
        cvPath: formData.cvPath,
      };

      await userService.updateProfile(updateData);
      setSuccess('Profil mis à jour avec succès');
      setIsEditing(false);

      setTimeout(() => {
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadUserProfile();
  };

  const handleDownloadCV = () => {
    if (formData.cvPath) {
      const cvUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${formData.cvPath}`;
      window.open(cvUrl, '_blank');
    }
  };

  const handleDeleteCV = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer votre CV ?')) {
      try {
        setLoading(true);
        await userService.updateProfile({ cvPath: '' });
        setFormData(prev => ({ ...prev, cvPath: '' }));
        setSuccess('CV supprimé avec succès');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError('Erreur lors de la suppression du CV');
        setTimeout(() => setError(null), 3000);
      } finally {
        setLoading(false);
      }
    }
  };

  const validatePasswordFields = () => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    if (!currentPassword) {
      errors.currentPassword = 'Le mot de passe actuel est requis';
    }

    if (!newPassword) {
      errors.newPassword = 'Le nouveau mot de passe est requis';
    } else {
      if (newPassword.length < 8) {
        errors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
      } else if (!/[A-Z]/.test(newPassword)) {
        errors.newPassword = 'Le mot de passe doit contenir au moins une majuscule';
      } else if (!/[a-z]/.test(newPassword)) {
        errors.newPassword = 'Le mot de passe doit contenir au moins une minuscule';
      } else if (!/[0-9]/.test(newPassword)) {
        errors.newPassword = 'Le mot de passe doit contenir au moins un chiffre';
      } else if (!/[@#$%^&+=!]/.test(newPassword)) {
        errors.newPassword = 'Le mot de passe doit contenir au moins un caractère spécial';
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer le mot de passe';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setPasswordErrors(errors);
    return !errors.currentPassword && !errors.newPassword && !errors.confirmPassword;
  };

  const handlePasswordChangeRequest = () => {
    if (validatePasswordFields()) {
      setShowPasswordConfirmModal(true);
    }
  };

  const handleChangePassword = async () => {
    setShowPasswordConfirmModal(false);

    try {
      setLoading(true);
      setError(null);
      await userService.changePassword(currentPassword, newPassword);
      setSuccess('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de mot de passe');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !type) return null;

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            Informations Personnelles
          </h4>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Annuler
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white p-2 shadow-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-4">
          <div className="flex items-center space-x-6 mb-6">
            <div className="relative">
              <img
                src={tempAvatar || avatar}
                alt="Profile"
                className="h-28 w-28 rounded-full object-cover border-4 border-orange-200 dark:border-orange-700 shadow-lg"
              />
              {pendingAvatarFile && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1 rounded-full">
                  <Eye className="h-4 w-4" />
                </div>
              )}
              {/* <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-full shadow-lg transition-colors disabled:opacity-50"
              >
                <Camera className="h-5 w-5" />
              </button> */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                {formData.prenom} {formData.nom}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                  {authUser?.role || 'Utilisateur'}
                </span>
              </p>
              {!isEditing && !pendingAvatarFile && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <Eye className="h-3 w-3 inline mr-1" />
                  Mode prévisualisation - Cliquez sur "Modifier" pour éditer
                </p>
              )}
              {pendingAvatarFile && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveAvatar}
                    disabled={loading}
                    className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                    {loading ? 'Sauvegarde...' : 'Sauvegarder photo'}
                  </button>
                  <button
                    onClick={handleCancelAvatar}
                    disabled={loading}
                    className="px-4 py-1.5 bg-gray-400 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all ${
                      validationErrors.nom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {validationErrors.nom && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.nom}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all ${
                      validationErrors.prenom ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {validationErrors.prenom && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.prenom}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  L'email ne peut pas être modifié
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Date de Naissance
                  </label>
                  <input
                    type="date"
                    name="dateNaissance"
                    value={formData.dateNaissance}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Téléphone
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                      +261
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const onlyDigits = e.target.value.replace(/\D/g, '');
                        handleInputChange({
                          target: { name: 'phone', value: onlyDigits }
                        } as any);
                      }}
                      maxLength={9}
                      placeholder="Ex: 321234567"
                      className={`w-full px-4 py-2.5 border rounded-r-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all ${
                        validationErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Département
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Ex: Informatique, Ressources Humaines..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Curriculum Vitae (CV)
                </label>

                {formData.cvPath ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-lg">
                          <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">CV disponible</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formData.cvPath.split('/').pop()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadCV}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="Télécharger le CV"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteCV}
                          disabled={loading}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          title="Supprimer le CV"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => cvInputRef.current?.click()}
                          disabled={loading}
                          className="p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          title="Remplacer le CV"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-orange-500 dark:hover:border-orange-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Aucun CV téléchargé
                    </p>
                    <button
                      type="button"
                      onClick={() => cvInputRef.current?.click()}
                      disabled={loading}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      <Upload className="h-4 w-4 inline mr-2" />
                      Télécharger un CV (PDF)
                    </button>
                  </div>
                )}

                <input
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleCVUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Format accepté: PDF uniquement • Taille max: 5 MB
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nom complet</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.prenom} {formData.nom}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {formData.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Date de naissance
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.dateNaissance ? new Date(formData.dateNaissance).toLocaleDateString('fr-FR') : 'Non renseignée'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Téléphone</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formData.phone || 'Non renseigné'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Département</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formData.department || 'Non renseigné'}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <FileText className="h-3 w-3 inline mr-1" />
                  Curriculum Vitae
                </p>
                {formData.cvPath ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded">
                        <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        CV disponible
                      </span>
                    </div>
                    <button
                      onClick={handleDownloadCV}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucun CV téléchargé
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {(error || success) && (
          <div className={`p-4 rounded-lg ${error ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'}`}>
            <div className="flex items-center gap-2">
              {error ? <X className="h-5 w-5" /> : <Save className="h-5 w-5" />}
              <span className="font-medium">{error || success}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-red-600" />
          Changer le Mot de Passe
        </h4>
        <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mot de passe actuel *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
              }}
              placeholder="Entrez votre mot de passe actuel"
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {passwordErrors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouveau mot de passe *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                }}
                placeholder="Nouveau mot de passe"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {passwordErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmer le mot de passe *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                placeholder="Confirmez le mot de passe"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {passwordErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Exigences du mot de passe:</strong>
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-400 mt-2 ml-4 list-disc space-y-1">
              <li>Au moins 8 caractères</li>
              <li>Une lettre majuscule et une minuscule</li>
              <li>Au moins un chiffre</li>
              <li>Un caractère spécial (@, #, $, etc.)</li>
            </ul>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h5 className="font-medium text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              <span>Attention</span>
            </h5>
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              Après avoir changé votre mot de passe, vous ne pourrez plus vous connecter avec l'ancien mot de passe.
              Assurez-vous de bien mémoriser votre nouveau mot de passe.
            </p>
            <button
              onClick={handlePasswordChangeRequest}
              disabled={!currentPassword || !newPassword || !confirmPassword || loading}
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <KeyRound className="h-4 w-4" />
              <span>Changer le mot de passe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-yellow-600" />
          Préférences de Notifications
        </h4>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Notifications Email</h5>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Nouveaux stagiaires assignés</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Projets en retard</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Rapports hebdomadaires</span>
                <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Mises à jour importantes</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Notifications Push</h5>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Tâches terminées</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Mentions dans les commentaires</span>
                <input type="checkbox" className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <span className="text-sm text-gray-700 dark:text-gray-300">Échéances approchantes</span>
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Fréquence des résumés
            </label>
            <select className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="never">Jamais</option>
            </select>
          </div>

          <button className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium">
            <Save className="h-4 w-4" />
            Enregistrer les préférences
          </button>
        </div>
      </div>
    </div>
  );

  const renderDocumentation = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Book className="h-5 w-5 text-green-600" />
          À Propos de Stagiaire360
        </h4>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
              <span className="text-3xl font-bold text-orange-600"><Users className="h-6 w-6 text-white" /></span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Stagiaire360
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version 2.0.0 • Dernière mise à jour: Octobre 2025
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Description</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Stagiaire360 est une plateforme complète de gestion de stages qui simplifie le suivi des stagiaires,
                la gestion des projets et l'organisation des tâches. Conçue pour les entreprises modernes qui
                accueillent des stagiaires.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Fonctionnalités principales</h5>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
                <li>Gestion complète des stagiaires et encadreurs</li>
                <li>Suivi des projets et des tâches en temps réel</li>
                <li>Tableau de bord analytique avec métriques</li>
                <li>Génération de rapports et d'attestations</li>
                <li>Système de notifications intelligent</li>
                <li>Interface moderne et responsive</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Technologies</h5>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                  React
                </span>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  Spring Boot
                </span>
                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                  MySQL
                </span>
                <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                  TypeScript
                </span>
                <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full text-xs font-medium">
                  Tailwind CSS
                </span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Support & Contact</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Pour toute question ou assistance, contactez-nous:
              </p>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>📧 Email: support@stagiaire360.com</p>
                <p>🌐 Site web: www.stagiaire360.com</p>
                <p>📱 Téléphone: +212 34 00 000 00</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2025 Stagiaire. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const getModalTitle = () => {
    switch (type) {
      case 'users':
        return 'Gestion des Utilisateurs';
      case 'security':
        return 'Paramètres de Sécurité';
      case 'notifications':
        return 'Notifications';
      case 'documentation':
        return 'À Propos';
      default:
        return 'Paramètres';
    }
  };

  const getModalIcon = () => {
    switch (type) {
      case 'users':
        return <Users className="h-6 w-6 text-orange-600" />;
      case 'security':
        return <Lock className="h-6 w-6 text-red-600" />;
      case 'notifications':
        return <Bell className="h-6 w-6 text-yellow-600" />;
      case 'documentation':
        return <Book className="h-6 w-6 text-green-600" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'users':
        return renderUserManagement();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'documentation':
        return renderDocumentation();
      default:
        return null;
    }
  };

  return (
    <>
      <ConfirmModal
        isOpen={showPasswordConfirmModal}
        title="Confirmer le changement de mot de passe"
        message="Êtes-vous sûr de vouloir changer votre mot de passe ? Après cette action, vous devrez utiliser le nouveau mot de passe pour vous connecter."
        onConfirm={handleChangePassword}
        onCancel={() => setShowPasswordConfirmModal(false)}
      />
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getModalIcon()}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{getModalTitle()}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
    </>
  );
}
