import React, { useState, useEffect } from 'react';
import { X, Clock, FileText, CheckSquare, Users, User, Calendar } from 'lucide-react';
import { activityService, ActivityHistoryDTO } from '../../services/activityService';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const activityIcons = {
  PROJECT: FileText,
  TASK: CheckSquare,
  INTERN: Users,
  USER: User,
  default: FileText
};

const activityColors = {
  PROJECT: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  TASK: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
  INTERN: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
  USER: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
  default: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
};

export default function ActivityModal({ isOpen, onClose }: ActivityModalProps) {
  const [activities, setActivities] = useState<ActivityHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const loadActivities = async () => {
        try {
          const data = await activityService.getRecentActivities();
          setActivities(data);
        } catch (error) {
          console.error('Erreur lors du chargement des activités:', error);
        } finally {
          setLoading(false);
        }
      };
      loadActivities();
    }
  }, [isOpen]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-orange-500" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Toutes les Activités</h3>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Chargement des activités...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Aucune activité disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.entityType as keyof typeof activityIcons] || activityIcons.default;
                const colorClass = activityColors[activity.entityType as keyof typeof activityColors] || activityColors.default;

                return (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 border border-gray-100 dark:border-gray-700">
                    <div className={`p-2 rounded-full ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.action}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {activity.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activities.length} activités au total
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}