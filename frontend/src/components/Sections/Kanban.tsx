import React, { useState, useEffect } from "react";
import {
  Trello,
  Plus,
  Calendar,
  User,
  Tag,
  ChevronDown,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import { Task } from "../../types";
import TaskFormModal from "../Modals/TaskFormModal";
import { projectService, ProjectDTO } from "../../services/projectService";
import { taskService, TaskDTO } from "../../services/taskService";
import { internService } from "../../services/internService";
import { useAuth } from "../../contexts/AuthContext";
import { encadreurService } from "../../services/encadreurService";

export default function Kanban() {
  const { authUser } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [draggedTask, setDraggedTask] = useState<TaskDTO | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<TaskDTO | null>(null);

  useEffect(() => {
    loadProjects();
  }, [authUser]);

  useEffect(() => {
    if (selectedProject) {
      loadTasks();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    if (!authUser) return;

    try {
      setLoading(true);
      setError(null);
      let projectsData: ProjectDTO[] = [];

      if (authUser.role === "ADMIN") {
        projectsData = await projectService.getAllProjects();
      } else if (authUser.role === "ENCADREUR") {
        const dataa = await encadreurService.getEncadreurById(
          authUser.profile.userID
        );
        projectsData = await projectService.getAllProjects({
          encadreurId: dataa.encadreurId,
        });
      } else if (authUser.role === "STAGIAIRE") {
        const internData = await internService.getInternByUserId(
          authUser.profile.userID
        );

        ////////

        const currentIntern = internData.userId;
        if (currentIntern) {
          const allprojectfind = await projectService.getAllProjects({
            encadreurId: authUser.profile.encadreur_id,
          });

          const stagiaireRecherche = currentIntern.toString();
          const projetsTrouves = allprojectfind
            .filter(
              (projet) =>
                projet.stagiaireId && // exclure les null
                projet.stagiaireId
                  .split(",") // séparer les id par virgule
                  .map((id) => id.trim()) // enlever les espaces
                  .includes(stagiaireRecherche) // vérifier si l'id est présent
            )
            .map((projet) => projet.id); // récupérer seulement les id de projets

          const projetsSelectionnes = allprojectfind.filter((projet) =>
            projetsTrouves.includes(projet.id)
          );

          projectsData = projetsSelectionnes;
        }

        ////////
      }

      setProjects(projectsData);

      if (projectsData.length > 0 && !selectedProject) {
        setSelectedProject(projectsData[0].id.toString());
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des projets:", err);
      setError("Impossible de charger les projets");
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!selectedProject) return;

    try {
      setError(null);
      const tasksData = await taskService.getAllTasks({
        projectId: Number(selectedProject),
      });
      setTasks(tasksData);
    } catch (err: any) {
      console.error("Erreur lors du chargement des tâches:", err);
      setError("Impossible de charger les tâches");
    }
  };

  const selectedProjectData = projects.find(
    (p) => p.id.toString() === selectedProject
  );

  const todoTasks = tasks.filter((task) => task.status === "TODO");
  const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((task) => task.status === "DONE");
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const handleDragStart = (e: React.DragEvent, task: TaskDTO) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragOver = (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnStatus);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };
const calculateProjectProgress = (tasks: TaskDTO[]) => {
  if (tasks.length === 0) return 0;
  const doneCount = tasks.filter((task) => task.status === "DONE").length;
  return Math.round((doneCount / tasks.length) * 100);
};

  // 🧠 Fonction appelée lors du drop
const handleDrop = async (
  e: React.DragEvent,
  newStatus: "TODO" | "IN_PROGRESS" | "DONE"
) => {
  e.preventDefault();
  setDragOverColumn(null);

  if (draggedTask && draggedTask.status !== newStatus) {
    try {
      // 1️⃣ Mise à jour du statut de la tâche
      await taskService.updateTaskStatus(draggedTask.id, {
        status: newStatus,
      });

      // 2️⃣ Mise à jour locale
      const updatedTasks = tasks.map((task) =>
        task.id === draggedTask.id ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);

      // 3️⃣ Calcul progression
      const newProgress = calculateProjectProgress(updatedTasks);

      let newStatusValue: ProjectDTO["status"] = "IN_PROGRESS";
      if (newProgress === 100) newStatusValue = "COMPLETED";
      else if (newProgress === 0) newStatusValue = "PLANNING";
      else newStatusValue = "IN_PROGRESS";

      // 5️⃣ Envoi au backend avec le statut mis à jour
      if (selectedProject) {
        await projectService.updateProject(Number(selectedProject), {
          progress: newProgress,
          status: newStatusValue,
        });
      }

      // 6️⃣ Mise à jour locale des projets
      setProjects((prev) =>
        prev.map((p) =>
          p.id.toString() === selectedProject
            ? { ...p, progress: newProgress, status: newStatusValue }
            : p
        )
      );
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      setError("Impossible de mettre à jour la progression du projet");
    } finally {
      setDraggedTask(null);
    }
  }
};

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDeleteTask = async (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;

    try {
      await taskService.deleteTask(taskId);
      await loadTasks();
      setOpenMenuId(null);
    } catch (err) {
      console.error('Erreur lors de la suppression de la tâche:', err);
      setError('Impossible de supprimer la tâche');
    }
  };

  const handleEditTask = (task: TaskDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setShowTaskForm(true);
    setOpenMenuId(null);
  };

  const TaskCard = ({ task }: { task: TaskDTO }) => {
    const isDragging = draggedTask?.id === task.id;

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-move ${
          isDragging ? "opacity-50 rotate-2 scale-105" : ""
        }`}
      >

        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
            {task.title}
          </h4>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </span>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === task.id ? null : task.id);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              {openMenuId === task.id && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    onClick={(e) => handleEditTask(task, e)}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(task.dueDate).toLocaleDateString("fr-FR")}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              #{task.assignedTo}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const KanbanColumn = ({
    title,
    tasks,
    count,
    bgColor,
    status,
    icon: Icon,
  }: {
    title: string;
    tasks: TaskDTO[];
    count: number;
    bgColor: string;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    icon: React.ElementType;
  }) => (
    <div className="flex-1 min-w-80">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${bgColor}`} />
            <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
              {count}
            </span>
          </div>
          <button
            onClick={() => setShowTaskForm(true)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div
          className={`space-y-3 max-h-96 overflow-y-auto min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-all duration-200 ${
            dragOverColumn === status
              ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20"
              : "border-transparent"
          }`}
          onDragOver={(e) => handleDragOver(e, status)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status)}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune tâche</p>
              {dragOverColumn === status && (
                <p className="text-xs mt-1 text-orange-500">
                  Déposez la tâche ici
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Chargement des projets...
          </p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <Trello className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Aucun projet disponible
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Vous n'avez accès à aucun projet pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kanban Board
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Gérer les tâches par projet (glisser-déposer)
          </p>
        </div>

        <div className="relative mt-4 sm:mt-0">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white">
                {selectedProjectData?.title || "Sélectionner un projet"}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            <button
              onClick={() => setShowTaskForm(true)}
              disabled={!selectedProject}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une Tâche</span>
            </button>
          </div>

          {showProjectDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProject(project.id.toString());
                    setShowProjectDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {project.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {project.progress}% complété
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProjectData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedProjectData.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Échéance:{" "}
                {new Date(selectedProjectData.endDate).toLocaleDateString(
                  "fr-FR"
                )}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(
                  (doneTasks.length / Math.max(tasks.length, 1)) * 100
                )}
                %
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Complété
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (doneTasks.length / Math.max(tasks.length, 1)) * 100
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span>Terminé: {doneTasks.length}</span>
              <span>En cours: {inProgressTasks.length}</span>
              <span>À faire: {todoTasks.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-6 overflow-x-auto pb-4">
        <KanbanColumn
          title="À faire"
          tasks={todoTasks}
          count={todoTasks.length}
          bgColor="bg-yellow-500"
          status="TODO"
          icon={Trello}
        />
        <KanbanColumn
          title="En cours"
          tasks={inProgressTasks}
          count={inProgressTasks.length}
          bgColor="bg-orange-500"
          status="IN_PROGRESS"
          icon={User}
        />
        <KanbanColumn
          title="Terminé"
          tasks={doneTasks}
          count={doneTasks.length}
          bgColor="bg-green-500"
          status="DONE"
          icon={Tag}
        />
      </div>

      <TaskFormModal
        isOpen={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setEditingTask(null);
        }}
        onSubmit={async (taskData) => {
          try {
            if (editingTask) {
              await taskService.updateTask(editingTask.id, taskData);
            } else {
              await taskService.createTask({
                ...taskData,
                status: "TODO",
              });
            }
            await loadTasks();
            setShowTaskForm(false);
            setEditingTask(null);
          } catch (err) {
            console.error("Erreur lors de la création/modification de la tâche:", err);
            setError("Impossible de créer/modifier la tâche");
          }
        }}
        projectId={selectedProject || undefined}
        initialTask={editingTask || undefined}
      />
    </div>
  );
}
