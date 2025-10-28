import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, CheckCircle, AlertTriangle, Info, User } from 'lucide-react';
import SearchModal from '../Modals/SearchModal';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { userService } from '../../services/userService';

interface HeaderProps {
  onNavigate?: (section: string) => void;
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'Responsable RH';
    case 'ENCADREUR':
      return 'Encadreur';
    case 'STAGIAIRE':
      return 'Stagiaire';
    default:
      return 'Utilisateur';
  }
};

export default function Header({ onNavigate }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const notificationRef = useRef<HTMLDivElement>(null);
  const { authUser, signOut } = useAuth();

  const unreadCount = notifications.filter(n => !n.read).length;

  // 🔹 Charger les notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        if (authUser?.id) {
          const data = await notificationService.getUserNotifications(authUser.id);
          setNotifications(data);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    loadNotifications();

    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [authUser]);

  // 🔹 Charger le profil utilisateur depuis le backend
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await userService.getCurrentProfile();
        setProfileImage(
          profile.avatar || ''
        );
        setFullName(`${profile.prenom} ${profile.nom}`);
        setRole(profile.role || 'Utilisateur');
      } catch (err) {
        console.error('Erreur de chargement du profil:', err);
      }
    };
    loadProfile();
  }, [authUser]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Responsable RH';
      case 'ENCADREUR':
        return 'Encadreur';
      case 'STAGIAIRE':
        return 'Stagiaire';
      default:
        return 'Utilisateur';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800 px-4 md:px-6 py-4 fixed top-0 right-0 md:left-64 left-0 z-10">
        <div className="flex items-center justify-between">

          {/* Recherche */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher stagiaires, projets, tâches..."
                onClick={() => setShowSearch(true)}
                readOnly
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">

            {/* Recherche mobile */}
            <button
              onClick={() => setShowSearch(true)}
              className="md:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="fixed md:absolute inset-0 md:inset-auto md:right-0 md:mt-2 md:w-80 bg-white dark:bg-gray-800 md:border border-gray-200 dark:border-gray-700 md:rounded-xl md:shadow-lg z-50 md:max-h-96 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={async () => {
                          if (authUser?.id) {
                            await notificationService.markAllAsRead(authUser.id);
                            const data = await notificationService.getUserNotifications(authUser.id);
                            setNotifications(data);
                          }
                        }}
                        className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                      >
                        Tout marquer comme lu
                      </button>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="h-[calc(100vh-8rem)] md:max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-full ${
                              notification.type === 'success'
                                ? 'bg-green-100 dark:bg-green-900/50'
                                : notification.type === 'warning'
                                ? 'bg-orange-100 dark:bg-orange-900/50'
                                : 'bg-blue-100 dark:bg-blue-900/50'
                            }`}
                          >
                            {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                            {notification.type === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                            {notification.type === 'info' && <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{notification.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{notification.timestamp}</p>
                          </div>
                          {!notification.read && <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-gray-200 dark:border-gray-700 hidden md:block">
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-center text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                    >
                      Voir toutes les notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profil avec avatar + initiales si null */}
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden text-white font-semibold">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Avatar"
                    className="h-10 w-10 object-cover rounded-full"
                  />
                ) : (
                  <span>
                    {fullName
                      .split(' ')
                      .map(name => name[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </span>
                )}
              </div>

              <div className="flex flex-col text-sm">
                <div className="font-medium text-gray-900 dark:text-white">{fullName || 'Utilisateur'}</div>
                <div className="text-gray-500 dark:text-gray-400">{getRoleLabel(role) }</div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Modals */}
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </>
  );
}
