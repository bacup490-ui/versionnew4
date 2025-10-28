import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ProjectStatusData {
  name: string;
  value: number;
  color: string;
}

interface ProjectStatusChartProps {
  activeProjects: number;
  totalProjects: number;
}

export default function ProjectStatusChart({ activeProjects, totalProjects }: ProjectStatusChartProps) {
  const chartData: ProjectStatusData[] = [
    { name: 'Projets Actifs', value: activeProjects, color: '#f59e0b' },
    { name: 'Projets Terminés', value: totalProjects, color: '#10b981' },
  ].filter(item => item.value > 0);

  const renderCustomizedLabel = ({ name, value }: any) => {
    return `${name}: ${value}`;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Répartition des Projets</h3>
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Répartition des Projets</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Actifs vs Terminés</p>
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