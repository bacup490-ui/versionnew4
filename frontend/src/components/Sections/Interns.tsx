import React, { useEffect, useState } from "react";
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  User,
  MoreVertical,
  UserX,
  UserCheck,
} from "lucide-react";
import { internService, InternDTO } from "../../services/internService";
import { useAuth } from "../../contexts/AuthContext";
import { useApiError } from "../../hooks/useApiError";
import InternFormModal from "../Modals/InternFormModal";
import InternDetailModal from "../Modals/InternDetailModal";

export default function Interns() {
  const { authUser } = useAuth();
  const [interns, setInterns] = useState<InternDTO[]>([]);
  const [filteredInterns, setFilteredInterns] = useState<InternDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<InternDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const handleApiError = useApiError();

  useEffect(() => {
    loadInterns();
  }, [authUser]);

  function capitalizeFirstLetter(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  const loadInterns = async () => {
    try {
      setLoading(true);
      let data: InternDTO[];

      if (authUser?.role === "ADMIN") {
        data = await internService.getAllInterns();
        console.log(data);
      } else if (authUser?.role === "ENCADREUR") {
        const userId = authUser.profile.userID;
        data = await internService.getAllInterns({ encadreurUserId: userId });
      } else {
        data = [];
      }

      setInterns(data);
      setFilteredInterns(data);
    } catch (error: any) {
      handleApiError(error, "Erreur lors du chargement des stagiaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...interns];

    if (searchQuery) {
      filtered = filtered.filter(
        (interns) =>
          interns.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          interns.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          interns.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          interns.school.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((intern) => intern.status === statusFilter);
    }

    setFilteredInterns(filtered);
  }, [searchQuery, statusFilter, interns]);

  const handleInternClick = (intern: InternDTO) => {
    setSelectedIntern(intern);
    setIsDetailModalOpen(true);
  };

  const handleFormSubmit = () => {
    setIsFormModalOpen(false);
    loadInterns();
  };

  const handleSuspendAccount = async (intern: InternDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { userService } = await import('../../services/userService');
      await userService.suspendAccount(intern.userId);
      loadInterns();
      setOpenMenuId(null);
    } catch (error: any) {
      handleApiError(error, 'Erreur lors de la suspension du compte');
    }
  };

  const handleActivateAccount = async (intern: InternDTO, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { userService } = await import('../../services/userService');
      await userService.activateAccount(intern.userId);
      loadInterns();
      setOpenMenuId(null);
    } catch (error: any) {
      handleApiError(error, 'Erreur lors de l\'activation du compte');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: {
        label: "En attente",
        className:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      },
      ACTIVE: {
        label: "Actif",
        className:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      },
      COMPLETED: {
        label: "Terminé",
        className:
          "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
      },
      CANCELLED: {
        label: "Annulé",
        className:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Stagiaires
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {authUser?.role === "ADMIN" && "Gestion de tous les stagiaires"}
            {authUser?.role === "ENCADREUR" && "Mes stagiaires assignés"}
          </p>
        </div>

        <button
          onClick={() => setIsFormModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <UserPlus className="h-5 w-5" />
          Ajouter un stagiaire
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un stagiaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="all">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="ACTIVE">Actif</option>
          <option value="COMPLETED">Terminé</option>
          <option value="CANCELLED">Annulé</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Chargement des stagiaires...
          </p>
        </div>
      ) : filteredInterns.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun stagiaire trouvé
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || statusFilter !== "all"
              ? "Aucun résultat ne correspond à vos critères de recherche."
              : "Commencez par ajouter votre premier stagiaire."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInterns.map((intern) => (
            <div
              key={intern.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3" onClick={() => handleInternClick(intern)}>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 text-white font-semibold overflow-hidden">
                    {intern.avatar ? (
                      <img
                        src={intern.avatar}
                        alt={`${intern.firstName} ${intern.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        {intern.firstName[0].toUpperCase()}
                        {intern.lastName[0].toUpperCase()}
                      </>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {capitalizeFirstLetter(intern.firstName)}{" "}
                      {intern.lastName.toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {intern.department}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(intern.status)}
                  {(authUser?.role === 'ADMIN' || authUser?.role === 'ENCADREUR') && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === intern.id ? null : intern.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </button>
                      {openMenuId === intern.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                          {intern.accountStatus === 'ACTIVE' ? (
                            <button
                              onClick={(e) => handleSuspendAccount(intern, e)}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-lg"
                            >
                              <UserX className="h-4 w-4" />
                              Suspendre le compte
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleActivateAccount(intern, e)}
                              className="w-full px-4 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-lg"
                            >
                              <UserCheck className="h-4 w-4" />
                              Activer le compte
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>
                      Encadré par :
                      {intern.encadreurName ? (
                        <span className="font-semibold uppercase text-gray-700 dark:text-gray-300">
                          {" " + intern.encadreurName}
                        </span>
                      ) : (
                        <span className="italic text-gray-400">
                          {" "}
                          Non assigné
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{intern.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span>{intern.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <GraduationCap className="h-4 w-4" />
                  <span className="truncate">{intern.school}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(intern.startDate).toLocaleDateString()} -{" "}
                    {new Date(intern.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <InternFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        defaultEncadreurId={
          authUser?.role === "ENCADREUR" ? authUser.profile.userID : null
        }
      />

      {selectedIntern && (
        <InternDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedIntern(null);
          }}
          intern={selectedIntern}
          onUpdate={loadInterns}
        />
      )}
    </div>
  );
}
