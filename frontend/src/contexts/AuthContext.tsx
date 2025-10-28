import { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser } from '../types/auth';
import { authService, AuthResponse } from '../services/authService';
import { apiService } from '../services/api';
import ConfirmModal from '../components/Modals/ConfirmModal';

interface AuthContextType {
  user: { id: string; email: string } | null;
  authUser: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser['profile']>) => void; // nouvelle fonction
  showLogoutModal: () => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = 'auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      const token = apiService.getToken();

      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          setUser({ id: userData.id.toString(), email: userData.email });
          setAuthUser({
            profile: {
              firstName: userData.prenom,
              lastName: userData.nom,
              email: userData.email,
              userID: userData.id,
              avatar: `https://ui-avatars.com/api/?name=${userData.prenom}+${userData.nom}&background=random`,
            },
            role: userData.role,
          });
        } catch (error) {
          console.error('❌ Erreur de chargement utilisateur:', error);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          apiService.setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authService.login({ email, password });

      if (!response.user || !response.token) throw new Error('Email ou mot de passe incorrect');

      const userAuth = {
        id: response.user.id.toString(),
        email: response.user.email,
      };

      setUser(userAuth);
      setAuthUser({
        profile: {
          firstName: response.user.prenom,
          lastName: response.user.nom,
          email: response.user.email,
          userID: response.user.id,
          avatar: `https://ui-avatars.com/api/?name=${response.user.prenom}+${response.user.nom}&background=random`,
        },
        role: response.user.role,
      });

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(response.user));
      apiService.setToken(response.token);
    } catch (error: any) {
      console.error("❌ Erreur de connexion:", error);
      throw new Error(error.message || "Impossible de se connecter au serveur");
    }
  };

  const signOut = async () => {
    setUser(null);
    setAuthUser(null);
    authService.logout();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    apiService.setToken(null);
    setIsModalOpen(false);};
  const showLogoutModal = () => setIsModalOpen(true);

  const updateProfile = (data: Partial<AuthUser['profile']>) => {
    setAuthUser((prev) => prev ? { ...prev, profile: { ...prev.profile, ...data } } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, authUser, loading, signIn, signOut, updateProfile,showLogoutModal }}>
      {children}
       <ConfirmModal
        isOpen={isModalOpen}
        message="Voulez-vous vraiment vous déconnecter ?"
        onCancel={() => setIsModalOpen(false)}
        onConfirm={signOut}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
