import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { internService } from '../../services/internService';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import { encadreurService } from '../../services/encadreurService';
import { useApiError } from '../../hooks/useApiError';

interface DepartmentDataPoint {
  department: string;
  interns: number;
}

interface TaskStatusDataPoint {
  status: string;
  count: number;
}

export default function DepartmentChart() {
  const { authUser } = useAuth();
  const { handleApiError } = useApiError();
  const [chartData, setChartData] = useState<DepartmentDataPoint[] | TaskStatusDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [authUser]);

  const loadChartData = async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      const userId = authUser.profile.userID;

      if (authUser.role === 'ADMIN' || authUser.role === 'ENCADREUR') {
        let interns;

        if (authUser.role === 'ADMIN') {
          interns = await internService.getAllInterns();
        } else {
          const dataa = await encadreurService.getEncadreurById(userId);
          interns = await internService.getAllInterns({ encadreurId: dataa.encadreurId });
        }

        const departmentMap = new Map<string, number>();
        interns.forEach(intern => {
          const dept = intern.department || 'Non défini';
          departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
        });

        const departmentData: DepartmentDataPoint[] = Array.from(departmentMap.entries())
          .map(([department, interns]) => ({ department, interns }))
          .sort((a, b) => b.interns - a.interns);

        setChartData(departmentData);

      } else if (authUser.role === 'STAGIAIRE') {
        const [internData, projects, tasks] = await Promise.all([
          internService.getAllInterns(),
          projectService.getAllProjects(),
          taskService.getAllTasks({ userId })
        ]);

        const currentIntern = internData.find(i => i.userId === userId);
        const userIdString = currentIntern?.userId?.toString() ?? '';
        const myProjects = projects.filter(p => String(p.stagiaireId) === userIdString);
        const projectIds = myProjects.map(p => p.id);
        const myTasks = tasks.filter(t => projectIds.includes(t.projectId));

        const statusMap = new Map<string, number>();
        myTasks.forEach(task => {
          const status = getStatusLabel(task.status);
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });

        const taskStatusData: TaskStatusDataPoint[] = Array.from(statusMap.entries())
          .map(([status, count]) => ({ status, count }))
          .sort((a, b) => {
            const order = ['À faire', 'En cours', 'Terminé', 'Bug'];
            return order.indexOf(a.status) - order.indexOf(b.status);
          });

        setChartData(taskStatusData);
      }
    } catch (error: any) {
      handleApiError(error, 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'TODO': return 'À faire';
      case 'IN_PROGRESS': return 'En cours';
      case 'DONE': return 'Terminé';
      case 'BUG': return 'Bug';
      default: return status;
    }
  };

  const isStagiaire = authUser?.role === 'STAGIAIRE';
  const dataKey = isStagiaire ? 'count' : 'interns';
  const xAxisKey = isStagiaire ? 'status' : 'department';

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-80">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isStagiaire ? 'Mes Tâches par Statut' : 'Stagiaires par Département'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {isStagiaire ? 'Répartition de vos tâches par statut' : 'Répartition entre les différents départements'}
          </p>
        </div>
        <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
          {isStagiaire ? 'Aucune tâche disponible' : 'Aucun stagiaire disponible'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isStagiaire ? 'Mes Tâches par Statut' : 'Stagiaires par Département'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          {isStagiaire ? 'Répartition de vos tâches par statut' : 'Répartition entre les différents départements'}
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey={xAxisKey}
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar
              dataKey={dataKey}
              fill="#f97316"
              radius={[4, 4, 0, 0]}
              name={isStagiaire ? 'Tâches' : 'Stagiaires'}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}