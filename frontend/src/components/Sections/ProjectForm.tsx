import React, { useState, useEffect } from 'react';
import { X, Calendar, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { encadreurService } from '../../services/encadreurService';
import { internService, InternDTO } from '../../services/internService';
import { projectService, CreateProjectRequest } from '../../services/projectService';
import { validateRequired, validateMaxLength } from '../../utils/validation';

interface ProjectFormProps {
  onClose: () => void;
  onSubmit: (projectData: any) => void;
  onSuccess?: () => void;
}

export default function ProjectForm({ onClose, onSubmit, onSuccess }: ProjectFormProps) {
  const { authUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    department: '',
    encadreurId: 0,
    assignedInterns: [] as number[]
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [encadreurs, setEncadreurs] = useState<any[]>([]);
  const [interns, setInterns] = useState<InternDTO[]>([]);
  const [encadreurIdFromContext, setEncadreurIdFromContext] = useState<number | null>(null);

  const isAdmin = authUser?.role === 'ADMIN';
  const isEncadreur = authUser?.role === 'ENCADREUR';

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isAdmin) {
          const allEncadreurs = await encadreurService.getAllEncadreurs();
          setEncadreurs(allEncadreurs);
        } else if (isEncadreur && authUser?.profile?.userID) {
          const encadreurData = await encadreurService.getEncadreurByUserId(authUser.profile.userID);
          setEncadreurIdFromContext(encadreurData.encadreurId);
          setFormData(prev => ({ ...prev, encadreurId: encadreurData.id }));

          const allInterns = await internService.getAllInterns({ encadreurId: encadreurData.encadreurId });
          setInterns(allInterns);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Erreur lors du chargement des données');
      }
    };

    loadData();
  }, [isAdmin, isEncadreur, authUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const titleError = validateRequired(formData.title, 'Le titre');
    if (titleError) return setError(titleError);

    const titleLengthError = validateMaxLength(formData.title, 100, 'Le titre');
    if (titleLengthError) return setError(titleLengthError);

    const descriptionError = validateRequired(formData.description, 'La description');
    if (descriptionError) return setError(descriptionError);

    const startDateError = validateRequired(formData.startDate, 'La date de début');
    if (startDateError) return setError(startDateError);

    const endDateError = validateRequired(formData.endDate, 'La date de fin');
    if (endDateError) return setError(endDateError);

    // ✅ Vérification corrigée : la date de fin doit être postérieure à la date de début
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('La date de fin doit être postérieure à la date de début');
      return;
    }

    if (isAdmin && !formData.encadreurId) {
      setError('Veuillez sélectionner un encadreur');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateProjectRequest = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'PLANNING',
        encadreurId: isAdmin ? Number(formData.encadreurId) : encadreurIdFromContext!,
        stagiaireId: formData.assignedInterns.join(',')
      };

      const createdProject = await projectService.createProject(payload);
      onSubmit(createdProject);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la création du projet:', error);
      setError(error.message || 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  const handleInternToggle = (internId: number) => {
    setFormData(prev => ({
      ...prev,
      assignedInterns: prev.assignedInterns.includes(internId)
        ? prev.assignedInterns.filter(id => id !== internId)
        : [...prev.assignedInterns, internId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nouveau Projet</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Titre du projet *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Application mobile e-commerce"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Décrivez les objectifs et fonctionnalités du projet..."
            />
          </div>

          {/* Encadreur */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Encadreur *</label>
              <select
                value={formData.encadreurId}
                onChange={(e) => setFormData(prev => ({ ...prev, encadreurId: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner un encadreur</option>
                {encadreurs.map(enc => (
                  <option key={enc.encadreurId} value={enc.encadreurId}>
                    {enc.prenom} {enc.nom}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date de début *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date de fin *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Département */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Département</label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Informatique"
            />
          </div>

          {/* Assigné à (choix multiple) */}
          {isEncadreur && interns.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Assigner des stagiaires
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto 
                              border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                {interns.map(intern => (
                  <label key={intern.userId} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedInterns.includes(intern.userId)}
                      onChange={() => handleInternToggle(intern.userId)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {intern.firstName} {intern.lastName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Erreurs */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 
                         rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg 
                         hover:from-orange-600 hover:to-red-600 transition-all duration-200 
                         flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl 
                         transform hover:scale-105 w-full sm:w-auto"
            >
              {loading ? 'Création...' : 'Créer le Projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
