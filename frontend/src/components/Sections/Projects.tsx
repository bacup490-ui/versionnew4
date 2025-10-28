import React from "react";
import { useState, useEffect } from "react";
import { FolderOpen, Plus, Calendar, Users } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import ProjectForm from "./ProjectForm";
import ProjectDetailModal from "../Modals/ProjectDetailModal";
import { projectService, ProjectDTO } from "../../services/projectService";
import { encadreurService } from "../../services/encadreurService";
import { internService, InternDTO } from "../../services/internService";

export default function Projects() {
  const { authUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectDTO | null>(
    null
  );
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [interns, setInterns] = useState<InternDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userRole = authUser?.role || "STAGIAIRE";
  const userId = authUser?.profile?.userID;

  useEffect(() => {
    const loadProjects = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        let fetchedProjects: ProjectDTO[] = [];

        if (userRole === "ADMIN") {
          fetchedProjects = await projectService.getAllProjects();
        } else if (userRole === "ENCADREUR") {
          const encadreurData = await encadreurService.getEncadreurByUserId(
            userId
          );
          fetchedProjects = await projectService.getAllProjects({
            encadreurId: encadreurData.encadreurId,
          });
        } else if (userRole === "STAGIAIRE") {
          const internData = await internService.getAllInterns();
          const currentIntern = internData.find((i) => i.userId === userId);

          if (currentIntern) {
            const fetchprojectAll = await projectService.getAllProjects({
              encadreurId: currentIntern.encadreurId,
            });



            const stagiaireRecherche = currentIntern.userId.toString();
            console.log("ID Stagiaire recherché :", stagiaireRecherche);
            const projetsTrouves = fetchprojectAll
              .filter(
                (projet) =>
                  projet.stagiaireId && // exclure les null
                  projet.stagiaireId
                    .split(",") // séparer les id par virgule
                    .map((id) => id.trim()) // enlever les espaces
                    .includes(stagiaireRecherche) // vérifier si l'id est présent
              )
              .map((projet) => projet.id); // récupérer seulement les id de projets

            const projetsSelectionnes = fetchprojectAll.filter((projet) =>
              projetsTrouves.includes(projet.id)
            );

            console.log("Projets sélectionnés :", projetsSelectionnes);
            fetchedProjects = projetsSelectionnes;
          }
        }

        setProjects(fetchedProjects);
        const allInterns = await internService.getAllInterns();
        setInterns(allInterns);
      } catch (error: any) {
        console.error("Erreur lors du chargement des projets:", error);
        setError("Erreur lors du chargement des projets");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [userId, userRole]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "ON_HOLD":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PLANNING":
        return "En planification";
      case "IN_PROGRESS":
        return "En cours";
      case "COMPLETED":
        return "Terminé";
      case "ON_HOLD":
        return "En pause";
      case "CANCELLED":
        return "Annulé";
      default:
        return status;
    }
  };

  const handleViewProject = (project: ProjectDTO) => {
    setSelectedProject(project);
    setShowProjectDetail(true);
  };

  const handleProjectCreated = async () => {
    if (!userId) return;
    try {
      let fetchedProjects: ProjectDTO[] = [];

      if (userRole === "ADMIN") {
        fetchedProjects = await projectService.getAllProjects();
      } else if (userRole === "ENCADREUR") {
        const encadreurData = await encadreurService.getEncadreurByUserId(
          userId
        );
        fetchedProjects = await projectService.getAllProjects({
          encadreurId: encadreurData.encadreurId,
        });
      } else if (userRole === "STAGIAIRE") {
        const internData = await internService.getAllInterns();
        const currentIntern = internData.find((i) => i.userId === userId);

        if (currentIntern) {
          const fetchprojectAll = await projectService.getAllProjects({
            encadreurId: currentIntern.encadreurId,
          });

          const stagiaireRecherche = currentIntern.userId.toString();
          const projetsTrouves = fetchprojectAll
            .filter(
              (projet) =>
                projet.stagiaireId &&
                projet.stagiaireId
                  .split(",")
                  .map((id) => id.trim())
                  .includes(stagiaireRecherche)
            )
            .map((projet) => projet.id);

          const projetsSelectionnes = fetchprojectAll.filter((projet) =>
            projetsTrouves.includes(projet.id)
          );

          fetchedProjects = projetsSelectionnes;
        }
      }

      setProjects(fetchedProjects);
    } catch (error: any) {
      console.error("Erreur lors du rechargement des projets:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Projets
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Suivre et gérer les projets des stagiaires
          </p>
        </div>
        {(userRole === "ADMIN" || userRole === "ENCADREUR") && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Projet</span>
          </button>
        )}
      </div>

      {/* Project Form Modal */}
      {showForm && (
        <ProjectForm
          onClose={() => setShowForm(false)}
          onSubmit={(projectData: any) => {
            console.log("Nouveau projet créé:", projectData);
          }}
          onSuccess={handleProjectCreated}
        />
      )}

      {/* Project Details Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={showProjectDetail}
        onClose={() => {
          setShowProjectDetail(false);
          setSelectedProject(null);
        }}
        onUpdate={handleProjectCreated}
      />

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300">
            Chargement des projets...
          </p>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300">
            Aucun projet trouvé
          </p>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-lg">
                    <FolderOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {project.title}
                    </h3>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(
                        project.status
                      )}`}
                    >
                      {getStatusText(project.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-300">
                      Progression
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Échéance: {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleViewProject(project)}
                className="w-full mt-4 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium text-sm transition-colors"
              >
                Voir le Projet →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
