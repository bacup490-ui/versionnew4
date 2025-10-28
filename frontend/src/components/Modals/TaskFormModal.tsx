import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { projectService, ProjectDTO } from '../../services/projectService';
import { CreateTaskRequest } from '../../services/taskService';
import { validateRequired } from '../../utils/validation';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: CreateTaskRequest) => void;
  projectId?: string;
}

export default function TaskFormModal({ isOpen, onClose, onSubmit, projectId }: TaskFormModalProps) {
  const { authUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    dueDate: ''
  });

  const [errors, setErrors] = useState({
    title: '',
    dueDate: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<ProjectDTO | null>(null);

  useEffect(() => {
    const loadProjectData = async () => {
      if (!isOpen || !projectId) return;

      try {
        const project = await projectService.getProjectById(Number(projectId));
        setProjectData(project);
      } catch (error) {
        console.error('Erreur lors du chargement du projet:', error);
        setError('Erreur lors du chargement du projet');
      }
    };

    loadProjectData();
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {
      title: validateRequired(formData.title, 'Le titre') || '',
      dueDate: validateRequired(formData.dueDate, "La date d'échéance") || '',
    };

    // ✅ Vérification supplémentaire : la date d’échéance ne doit pas être avant aujourd’hui
    if (formData.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // on ignore l'heure
      const due = new Date(formData.dueDate);
      if (due < today) {
        newErrors.dueDate = "La date d'échéance ne peut pas être antérieure à aujourd'hui.";
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(err => err !== '');
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors] !== undefined) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (!projectId) {
      setError('Aucun projet sélectionné');
      return;
    }

    setLoading(true);
    try {
      const taskRequest: CreateTaskRequest = {
        title: formData.title,
        description: formData.description,
        projectId: Number(projectId),
        assignedTo: projectData!.stagiaireId,
        status: 'TODO',
        priority: formData.priority,
        dueDate: formData.dueDate
      };

      await onSubmit(taskRequest);

      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: ''
      });
      onClose();
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la création de la tâche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nouvelle Tâche</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Titre de la tâche *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Ex: Créer la page de connexion"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Décrivez la tâche en détail..."
            />
          </div>

          {/* Projet affiché */}
          {projectData && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Projet:</span> {projectData.title}
              </p>
            </div>
          )}

          {/* Priorité et Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Flag className="h-4 w-4 inline mr-1" />
                Priorité
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="LOW">Faible</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Élevée</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date d'échéance *
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                              errors.dueDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            }`}
              />
              {errors.dueDate && <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Erreurs globales */}
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
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg 
                         hover:from-orange-600 hover:to-red-600 transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer la Tâche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
