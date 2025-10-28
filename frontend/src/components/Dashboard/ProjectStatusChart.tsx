import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { useApiError } from '../../hooks/useApiError';

interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

export default function ProjectStatusChart() {
  const { handleApiError } = useApiError();
  const [chartData, setChartData] = useState<ProjectStatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectStatusData();
  }, []);

  const loadProjectStatusData = async () => {
    try {
      setLoading(true);
      const stats = await dashboardService.getProjectStatusStats();

      const data: ProjectStatusData[] = [
        { name: 'Planification', value: stats.planning, color: '#3b82f6' },
        { name: 'En cours', value: stats.inProgress, color: '#f59e0b' },
        { name: 'Terminé', value: stats.completed, color: '#10b981' },
        { name: 'En pause', value: stats.onHold, color: '#6b7280' },
        { name: 'Annulé', value: stats.cancelled, color: '#ef4444' },
      ].filter(item => item.value > 0);

      setChartData(data);
    } catch (error: any) {
      handleApiError(error, 'Erreur lors du chargement des statuts de projets');
    } finally {
      setLoading(false);
    }
  };

  const renderCustomizedLabel = ({ name, value }: any) => {
    return `${name}: ${value}`;
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Répartition des Statuts de Projets</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">État actuel de tous les projets</p>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Répartition des Statuts de Projets</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">État actuel de tous les projets</p>
        </div>
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">Aucun projet disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Répartition des Statuts de Projets</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">État actuel de tous les projets</p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={renderCustomizedLabel}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center flex-wrap gap-4 mt-4">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center">
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}