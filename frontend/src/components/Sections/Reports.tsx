import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, BarChart3, Users, CheckCircle, Clock, AlertCircle, FileBarChart, PieChart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { internService, InternDTO } from '../../services/internService';
import { projectService, ProjectDTO } from '../../services/projectService';
import { taskService, TaskDTO } from '../../services/taskService';
import { generatePDF } from '../../utils/pdfGenerator';
import { useApiError } from '../../hooks/useApiError';
import { encadreurService } from '../../services/encadreurService';

export default function Reports() {
  const { authUser } = useAuth();
  const { handleApiError } = useApiError();
  const [generatingReport, setGeneratingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<InternDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  
    

  useEffect(() => {
    loadReportData();
  }, [authUser]);

  const loadReportData = async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      const userId = authUser.profile.userID;

      if (authUser.role === 'ADMIN') {
        const [internsData, projectsData, tasksData] = await Promise.all([
          internService.getAllInterns(),
          projectService.getAllProjects(),
          taskService.getAllTasks()
        ]);
        setInterns(internsData);
        setProjects(projectsData);
        setTasks(tasksData);

      } else if (authUser.role === 'ENCADREUR') {

        const dataa = await encadreurService.getEncadreurById(
                          userId
        );


        const [internsData, projectsData, tasksData] = await Promise.all([
          internService.getAllInterns({ encadreurId: dataa.encadreurId  }),
          projectService.getAllProjects({ encadreurId: dataa.encadreurId }),
          taskService.getAllTasks()
        ]);

 

        const ProjectIDS = projectsData.map(i => i.id);
        console.log('Project IDs for ENCADREUR:', ProjectIDS);
        const filteredTasks = tasksData.filter(t => ProjectIDS.includes(t.projectId));
        setInterns(internsData);
        setProjects(projectsData);
        setTasks(filteredTasks);

      } else if (authUser.role === 'STAGIAIRE') {
        const [allInterns, allProjects, tasksData] = await Promise.all([
          internService.getAllInterns(),
          projectService.getAllProjects(),
          taskService.getAllTasks({ userId })
        ]);


        const currentIntern = allInterns.find(i => i.userId === userId);
        
        const userIdString = currentIntern?.userId?.toString() ?? '';

        const myProjects = allProjects.filter(p => String(p.stagiaireId) === userIdString);
        
        const idprojects = myProjects.map(p => p.id);
        const taskByProjectIds = tasksData.filter(t => idprojects.includes(t.projectId));

  
        console.log('Tasks by Project IDs for STAGIAIRE:', taskByProjectIds);
       


        setInterns(currentIntern ? [currentIntern] : []);
        setProjects(myProjects);
        setTasks(taskByProjectIds);
      }
    } catch (error: any) {
      handleApiError(error, 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const generateGlobalReport = async () => {
    if (!authUser) return;

    try {
      setGeneratingReport(true);

      const userName = `${authUser.profile.firstName} ${authUser.profile.lastName}`;
      const userAvatar = authUser.profile.avatar;

      await generatePDF({
        interns,
        projects,
        tasks,
        userRole: authUser.role,
        userName,
        userAvatar
      });

      setTimeout(() => {
        setGeneratingReport(false);
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      setGeneratingReport(false);
    }
  };
  
  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
  const completedProjects = projects.filter(p => p.status === 'COMPLETED').length;
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const successRate = projects.length > 0
    ? Math.round((completedProjects / projects.length) * 100)
    : 0;
  const taskCompletionRate = tasks.length > 0
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-xl shadow-lg">
              <FileBarChart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rapports</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Générer des rapports PDF professionnels</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-orange-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Taux de Réussite</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{successRate}%</p>
              <div className="mt-2 flex items-center">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${successRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-green-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Projets</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{projects.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {activeProjects} en cours • {completedProjects} terminés
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-lg">
              <PieChart className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-blue-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Tâches</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {completedTasks} terminées
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-red-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Complétion</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{taskCompletionRate}%</p>
              <div className="mt-2 flex items-center">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${taskCompletionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Rapport Global</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Générer un rapport PDF complet avec toutes les données
              </p>
            </div>
            <button
              onClick={generateGlobalReport}
              disabled={generatingReport || loading}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {generatingReport ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Génération...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Générer Rapport PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="border border-orange-200 dark:border-gray-700 rounded-lg p-5 bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Contenu du Rapport</h4>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                  <span>Résumé global des données</span>
                </li>
                {(authUser?.role === 'ADMIN' || authUser?.role === 'ENCADREUR') && (
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                    <span>Détails par stagiaire</span>
                  </li>
                )}
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                  <span>Détails par projet</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                  <span>Statistiques des tâches</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                  <span>Analyse et conclusion</span>
                </li>
              </ul>
            </div>

            <div className="border border-blue-200 dark:border-gray-700 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Données Incluses</h4>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                {(authUser?.role === 'ADMIN' || authUser?.role === 'ENCADREUR') && (
                  <li className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-blue-500 mr-2" />
                      <span>Stagiaires</span>
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{interns.length}</span>
                  </li>
                )}
                <li className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 text-green-500 mr-2" />
                    <span>Projets</span>
                  </div>
                  <span className="font-bold text-green-600 dark:text-green-400">{projects.length}</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-orange-500 mr-2" />
                    <span>Tâches</span>
                  </div>
                  <span className="font-bold text-orange-600 dark:text-orange-400">{tasks.length}</span>
                </li>
                <li className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-red-500 mr-2" />
                    <span>Taux de réussite</span>
                  </div>
                  <span className="font-bold text-red-600 dark:text-red-400">{successRate}%</span>
                </li>
              </ul>
            </div>

            <div className="border border-green-200 dark:border-gray-700 rounded-lg p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Informations</h4>
              </div>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center">
                  <Download className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Format PDF professionnel</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Téléchargement automatique</span>
                </li>
                <li className="flex items-center">
                  <Clock className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Données en temps réel</span>
                </li>
                <li className="flex items-center">
                  <Users className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Photo de profil incluse</span>
                </li>
                <li className="flex items-center">
                  <FileBarChart className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Logo et en-tête stylisé</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}