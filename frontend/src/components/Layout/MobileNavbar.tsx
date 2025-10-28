import React from 'react';
import { X, Home, Users, FolderOpen, Trello, FileText, Settings, Moon, Sun, UserCog, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface MobileNavbarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const getNavigation = (userRole: string) => {
  const baseNavigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, roles: ['ADMIN', 'ENCADREUR', 'STAGIAIRE'] },
    { id: 'interns', name: 'Stagiaires', icon: Users, roles: ['ADMIN', 'ENCADREUR'] },
    { id: 'encadreurs', name: 'Encadreurs', icon: UserCog, roles: ['ADMIN'] },
    { id: 'projects', name: 'Projets', icon: FolderOpen, roles: ['ADMIN', 'ENCADREUR', 'STAGIAIRE'] },
    { id: 'kanban', name: 'Kanban', icon: Trello, roles: ['ADMIN', 'ENCADREUR', 'STAGIAIRE'] },
    { id: 'reports', name: 'Rapports', icon: FileText, roles: ['ADMIN', 'ENCADREUR'] },
    { id: 'settings', name: 'Paramètres', icon: Settings, roles: ['ADMIN', 'ENCADREUR', 'STAGIAIRE'] },
  ];

  return baseNavigation.filter(item => item.roles.includes(userRole));
};

export default function MobileNavbar({ isOpen, onClose, activeSection, onSectionChange }: MobileNavbarProps) {
  const { isDark, toggleTheme } = useTheme();
  const { authUser, showLogoutModal } = useAuth();
  const navigation = getNavigation(authUser?.role || 'STAGIAIRE');

  const handleNavClick = (section: string) => {
    onSectionChange(section);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-2 mr-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">InternHub</h1>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Navigation + Theme */}
        <nav className="flex-1 px-3 py-6 flex flex-col">
          <div className="space-y-1 overflow-y-auto flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={clsx(
                    'w-full flex items-center px-3 py-3 text-base font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 text-orange-700 dark:text-orange-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Icon className={clsx(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'
                  )} />
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-3 py-3 mt-6 text-base font-medium rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
          >
            {isDark
              ? <Sun className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
              : <Moon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500" />}
            {isDark ? 'Mode Clair' : 'Mode Sombre'}
          </button>

          {/* Bouton Se déconnecter tout en bas */}
          <div className="mt-auto px-3 pb-6">
            <button
              onClick={showLogoutModal}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all duration-200"
            >
              <LogOut className="h-5 w-5" />
              Se déconnecter
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
