import React, { useState, useEffect } from 'react';
import { Clock, FileText, CheckSquare, Users, User } from 'lucide-react';
import { activityService, ActivityHistoryDTO } from '../../services/activityService';
import ActivityModal from '../Modals/ActivityModal';

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

export default function RecentActivity() {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [activities, setActivities] = useState<ActivityHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const data = await activityService.getRecentActivities();
        setActivities(data.slice(0, 5));
      } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
      } finally {
        setLoading(false);
      }
    };
    loadActivities();
  }, []);

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

  return (
    <>
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activité Récente</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Dernières mises à jour de votre équipe</p>
        </div>
        <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>

      {loading ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des activités...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune activité récente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.entityType as keyof typeof activityIcons] || activityIcons.default;
            const colorClass = activityColors[activity.entityType as keyof typeof activityColors] || activityColors.default;

            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                <div className={`p-2 rounded-full ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatTimestamp(activity.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setShowAllActivities(true)}
        className="w-full mt-4 text-sm text-orange-600 dark:text-orange-400 font-medium hover:text-orange-700 dark:hover:text-orange-300 transition-colors py-2"
      >
        Voir toutes les activités →
      </button>
    </div>

    <ActivityModal
      isOpen={showAllActivities}
      onClose={() => setShowAllActivities(false)}
    />
    </>
  );
}