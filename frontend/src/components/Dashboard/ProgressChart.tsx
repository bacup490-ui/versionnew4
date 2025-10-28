import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { internService } from '../../services/internService';
import { projectService } from '../../services/projectService';
import { encadreurService } from '../../services/encadreurService';
import { useApiError } from '../../hooks/useApiError';

interface ProgressDataPoint {
  month: string;
  progress: number;
  performance: number;
}

export default function ProgressChart() {
  const { authUser } = useAuth();
  const { handleApiError } = useApiError();
  const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [authUser]);

  const loadProgressData = async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      const userId = authUser.profile.userID;

      if (authUser.role === 'ADMIN') {
        const [interns, projects] = await Promise.all([
          internService.getAllInterns(),
          projectService.getAllProjects()
        ]);

        const monthlyData = calculateMonthlyProgress(interns, projects);
        setProgressData(monthlyData);

      } else if (authUser.role === 'ENCADREUR') {
        const dataa = await encadreurService.getEncadreurById(userId);
        const [interns, projects] = await Promise.all([
          internService.getAllInterns({ encadreurId: dataa.encadreurId }),
          projectService.getAllProjects({ encadreurId: dataa.encadreurId })
        ]);

        const monthlyData = calculateMonthlyProgress(interns, projects);
        setProgressData(monthlyData);

      } else if (authUser.role === 'STAGIAIRE') {
        const [internData, projects] = await Promise.all([
          internService.getAllInterns(),
          projectService.getAllProjects()
        ]);

        const currentIntern = internData.find(i => i.userId === userId);
        const userIdString = currentIntern?.userId?.toString() ?? '';
        const myProjects = projects.filter(p => String(p.stagiaireId) === userIdString);

        const monthlyData = calculatePersonalProgress(currentIntern, myProjects);
        setProgressData(monthlyData);
      }
    } catch (error: any) {
      handleApiError(error, 'Erreur lors du chargement des données de progression');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyProgress = (interns: any[], projects: any[]): ProgressDataPoint[] => {
    const monthsMap = new Map<string, { totalProgress: number; count: number; maxProgress: number }>();

    projects.forEach(project => {
      const date = new Date(project.startDate);
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

      const existing = monthsMap.get(monthKey) || { totalProgress: 0, count: 0, maxProgress: 0 };
      existing.totalProgress += project.progress;
      existing.count += 1;
      existing.maxProgress = Math.max(existing.maxProgress, project.progress);
      monthsMap.set(monthKey, existing);
    });

    const sortedMonths = Array.from(monthsMap.entries())
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6);

    return sortedMonths.map(([month, data]) => ({
      month,
      progress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0,
      performance: data.maxProgress
    }));
  };

  const calculatePersonalProgress = (intern: any, projects: any[]): ProgressDataPoint[] => {
    if (!intern || !intern.startDate || !intern.endDate) {
      return [];
    }

    const startDate = new Date(intern.startDate);
    const endDate = new Date(intern.endDate);
    const today = new Date();

    const monthlyData: ProgressDataPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= today && currentDate <= endDate) {
      const monthKey = currentDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

      const projectsAtMonth = projects.filter(p => {
        const projectStart = new Date(p.startDate);
        return projectStart <= currentDate;
      });

      const avgProgress = projectsAtMonth.length > 0
        ? Math.round(projectsAtMonth.reduce((sum, p) => sum + p.progress, 0) / projectsAtMonth.length)
        : 0;

      const maxProgress = projectsAtMonth.length > 0
        ? Math.max(...projectsAtMonth.map(p => p.progress))
        : 0;

      monthlyData.push({
        month: monthKey,
        progress: avgProgress,
        performance: maxProgress
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return monthlyData.slice(-6);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-80">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (progressData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progression des Stagiaires</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {authUser?.role === 'STAGIAIRE' ? 'Votre progression au fil du temps' : 'Progression moyenne et indicateurs de performance'}
          </p>
        </div>
        <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
          Aucune donnée de progression disponible
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progression des Stagiaires</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {authUser?.role === 'STAGIAIRE' ? 'Votre progression au fil du temps' : 'Progression moyenne et indicateurs de performance'}
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => `${value}%`}
            />
            <Line
              type="monotone"
              dataKey="progress"
              stroke="#f97316"
              strokeWidth={3}
              dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              name={authUser?.role === 'STAGIAIRE' ? 'Ma Progression' : 'Progression Moyenne'}
            />
            <Line
              type="monotone"
              dataKey="performance"
              stroke="#fb923c"
              strokeWidth={3}
              dot={{ fill: '#fb923c', strokeWidth: 2, r: 4 }}
              name="Meilleure Performance"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}