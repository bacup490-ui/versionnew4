import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Users, Lock, Bell, Camera, Book } from 'lucide-react';
import SettingsModal from '../Modals/SettingsModal';
import InternFormModal from '../Modals/InternFormModal';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

export default function Settings() {
  const { authUser, updateProfile } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'users' | 'security' | 'notifications' | 'documentation' | null>(null);
  const [showInternForm, setShowInternForm] = useState(false);
  const [profileImage, setProfileImage] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger le profil utilisateur une seule fois à l'ouverture du composant
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userService.getCurrentProfile();
        const avatar = profile.avatar || `https://ui-avatars.com/api/?name=${profile.prenom}+${profile.nom}&background=random`;
        setProfileImage(avatar);
        setFullName(`${profile.prenom} ${profile.nom}`);
        setRole(profile.role || 'Utilisateur');
      } catch (err) {
        console.error('Erreur de chargement du profil:', err);
      }
    };
    loadProfile();
  }, []); // ✅ dépendances vides pour éviter la boucle

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingImage(file);
    const objectUrl = URL.createObjectURL(file);
    setTempImageUrl(objectUrl);
  };

  const handleSaveImage = async () => {
    if (!pendingImage) return;

    try {
      const avatarUrl = await userService.uploadAvatar(pendingImage);
      const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}${avatarUrl}`;
      setProfileImage(fullUrl);
      updateProfile({ avatar: fullUrl });
      await userService.updateProfile({ avatar: avatarUrl });

      setPendingImage(null);
      setTempImageUrl('');
    const loadProfile = async () => {
      try {
        const profile = await userService.getCurrentProfile();
        const avatar = profile.avatar || `https://ui-avatars.com/api/?name=${profile.prenom}+${profile.nom}&background=random`;
        setProfileImage(avatar);
        setFullName(`${profile.prenom} ${profile.nom}`);
        setRole(profile.role || 'Utilisateur');
      } catch (err) {
        console.error('Erreur de chargement du profil:', err);
      }
    };
      loadProfile();

    } catch (err) {
      console.error('Erreur de mise à jour de la photo:', err);
    }
  };

  const handleCancelImage = () => {
    setPendingImage(null);
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl('');
    }
  };

  //  Mettre à jour le profil après fermeture du modal SettingsModal
  const handleProfileUpdated = async () => {
    try {
      const profile = await userService.getCurrentProfile();
      const avatar = profile.avatar || `https://ui-avatars.com/api/?name=${profile.prenom}+${profile.nom}&background=random`;
      setProfileImage(avatar);
      setFullName(`${profile.prenom} ${profile.nom}`);
      setRole(profile.role || 'Utilisateur');
      updateProfile({ avatar });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du profil:', err);
    }
  };

  const handleOpenModal = (type: 'users' | 'security' | 'notifications' | 'database') => {
    setModalType(type);
    setShowModal(true);
  };

  //  Formulaire stagiaire via événement global
  useEffect(() => {
    const handleOpenInternForm = () => setShowInternForm(true);
    window.addEventListener('openInternForm', handleOpenInternForm);
    return () => window.removeEventListener('openInternForm', handleOpenInternForm);
  }, []);

  const settingsSections = [
    {
      id: 'users',
      title: 'Gestion des Utilisateurs',
      description: 'Gérer les comptes utilisateurs et les permissions',
      icon: Users,
      color: 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400'
    },
    {
      id: 'security',
      title: 'Paramètres de Sécurité',
      description: "Configurer l'authentification et les contrôles d'accès",
      icon: Lock,
      color: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configurer les notifications email et système',
      icon: Bell,
      color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'
    },
    {
      id: 'documentation',
      title: 'A propos',
      description: "Guide d'utilisation et informations sur l'application",
      icon: Book,
      color: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
    }
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Configurer votre espace de travail InternHub
          </p>
        </div>

        {/* Profil Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Profil</h3>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={tempImageUrl || profileImage}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{fullName}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{role}</p>
              {pendingImage && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSaveImage}
                    className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white p-2 shadow-lg transition-colors"
                  >
                    Sauvegarder la photo
                  </button>
                  <button
                    onClick={handleCancelImage}
                    className="px-4 py-1.5 bg-gray-400 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Paramètres Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {settingsSections.map((section) => (
            <div
              key={section.id}
              onClick={() => handleOpenModal(section.id as any)}
              className="cursor-pointer p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
            >
              <div className={`inline-flex items-center justify-center p-3 rounded-lg ${section.color}`}>
                <section.icon className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mt-4">{section.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{section.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <SettingsModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            handleProfileUpdated(); // mise à jour Header après fermeture du modal
          }}
          type={modalType}
        />
      )}
      {showInternForm && <InternFormModal isOpen={showInternForm} onClose={() => setShowInternForm(false)} />}
    </>
  );
}
