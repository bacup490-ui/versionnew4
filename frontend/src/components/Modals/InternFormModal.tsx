import React, { useState, useEffect } from "react";
import { X, User, Mail, Building, Calendar, GraduationCap } from "lucide-react";
import { internService } from "../../services/internService";
import { encadreurService } from "../../services/encadreurService";
import { useApiError } from "../../hooks/useApiError";
import { useAuth } from "../../contexts/AuthContext";

interface InternFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (internData: any) => void;
}

export default function InternFormModal({
  isOpen,
  onClose,
  onSubmit,
}: InternFormModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    phone: "",
    departement: "",
    school: "",
    startDate: "",
    endDate: "",
    encadreurId: 0,
  });
  const [errors, setErrors] = useState({
    nom: "",
    prenom: "",
    email: "",
    phone: "",
    departement: "",
    school: "",
    startDate: "",
    endDate: "",
    encadreurId: "",
  });
  const [encadreurs, setEncadreurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const handleApiError = useApiError();
  const { authUser } = useAuth();

  const departments = [
    "Informatique",
    "Marketing",
    "Ressources Humaines",
    "Finance",
    "Ventes",
    "Support",
  ];

  useEffect(() => {
    if (isOpen) {
      loadEncadreurs();
      setErrors({
        nom: "",
        prenom: "",
        email: "",
        phone: "",
        departement: "",
        school: "",
        startDate: "",
        endDate: "",
        encadreurId: "",
      });
    }
  }, [isOpen]);

  const loadEncadreurs = async () => {
    try {
      const data = await encadreurService.getAllEncadreurs();
      if (authUser?.role === "ENCADREUR") {
        const storedUser = localStorage.getItem("auth_user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          const currentEncadreur = userData.encadreurId;
          if (currentEncadreur) {
            setEncadreurs([currentEncadreur]);
            setFormData((prev) => ({ ...prev, encadreurId: currentEncadreur }));
          }
        }
      } else {
        setEncadreurs(data);
      }
    } catch (error: any) {
      handleApiError(error, "Erreur lors du chargement des encadreurs");
    }
  };

  const validateField = (name: string, value: string | number) => {
    let error = "";

    switch (name) {
      case "prenom":
      case "nom":
        if (!value) {
          error = "Ce champ est obligatoire";
        } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(value.toString())) {
          error = "Doit contenir uniquement des lettres";
        }
        break;

      case "email":
        if (!value) {
          error = "Email obligatoire";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.toString())) {
          error = "Email invalide";
        }
        break;

      case "phone":
        if (!value) {
          error = "Téléphone obligatoire";
        } else if (!/^[3-9]\d{8}$/.test(value.toString())) {
          error = "Numéro invalide (8 chiffres après +261)";
        }
        break;

      case "school":
      case "departement":
        if (!value) error = "Ce champ est obligatoire";
        break;

      case "startDate":
      case "endDate":
        if (!value) {
          error = "Date obligatoire";
        } else if (
          name === "endDate" &&
          formData.startDate &&
          new Date(value.toString()) < new Date(formData.startDate)
        ) {
          error = "La date de fin doit être après la date de début";
        }
        break;

      case "encadreurId":
        if (!value) error = "Sélection obligatoire";
        break;

      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateForm = () => {
    const fieldNames = Object.keys(formData);
    let valid = true;
    fieldNames.forEach((field) => {
      const isValid = validateField(field, (formData as any)[field]);
      if (!isValid) valid = false;
    });
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const requestData = {
        email: formData.email,
        firstName: formData.prenom,
        lastName: formData.nom,
        phone: formData.phone,
        school: formData.school,
        department: formData.departement,
        startDate: formData.startDate,
        endDate: formData.endDate,
        encadreurId: Number(formData.encadreurId),
      };

      await internService.createIntern(requestData);

      onSubmit(formData);
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        phone: "",
        departement: "",
        school: "",
        startDate: "",
        endDate: "",
        encadreurId: 0,
      });
      onClose();
    } catch (error: any) {
      if (error?.response?.data?.error === "USER_EXIST") {
        setErrors((prev) => ({ ...prev, email: "Cet email existe déjà" }));
      } else {
        handleApiError(error, "Erreur lors de la création du stagiaire");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Nouveau Stagiaire
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Prénom & Nom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["prenom", "nom"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  {field === "prenom" ? "Prénom *" : "Nom *"}
                </label>
                <input
                  type="text"
                  value={(formData as any)[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    (errors as any)[field]
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder={field === "prenom" ? "Ex: Jean" : "Ex: Dupont"}
                />
                {(errors as any)[field] && (
                  <p className="text-red-500 text-sm mt-1">
                    {(errors as any)[field]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Email & Téléphone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.email
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="jean.dupont@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Téléphone *
              </label>
              <div className="flex items-center">
                <span className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                  +261
                </span>
                {/* Input pour le reste du numéro */}
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    // Supprimer tout ce qui n'est pas un chiffre
                    const onlyDigits = e.target.value.replace(/\D/g, "");
                    handleChange("phone", onlyDigits);
                  }}
                  className={`w-full px-3 py-2 border-t border-b border-r border-gray-300 dark:border-gray-600 rounded-r-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    errors.phone ? "border-red-500" : ""
                  }`}
                  placeholder="Ex: 321234567"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* École */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <GraduationCap className="h-4 w-4 inline mr-1" />
              École *
            </label>
            <input
              type="text"
              value={formData.school}
              onChange={(e) => handleChange("school", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.school
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Ex: Université Mohammed V"
            />
            {errors.school && (
              <p className="text-red-500 text-sm mt-1">{errors.school}</p>
            )}
          </div>

          {/* Département */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Building className="h-4 w-4 inline mr-1" />
              Département *
            </label>
            <select
              value={formData.departement}
              onChange={(e) => handleChange("departement", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.departement
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <option value="">Sélectionner un département</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.departement && (
              <p className="text-red-500 text-sm mt-1">{errors.departement}</p>
            )}
          </div>

          {/* Encadreur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Encadreur *
            </label>
            <select
              value={formData.encadreurId}
              onChange={(e) =>
                handleChange("encadreurId", Number(e.target.value))
              }
              disabled={authUser?.role === "ENCADREUR"}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.encadreurId
                  ? "border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <option value="">Sélectionner un encadreur</option>
              {encadreurs.map((enc) => (
                <option key={enc.encadreurId} value={enc.encadreurId}>
                  {enc.prenom} {enc.nom}
                </option>
              ))}
            </select>
            {errors.encadreurId && (
              <p className="text-red-500 text-sm mt-1">{errors.encadreurId}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["startDate", "endDate"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {field === "startDate" ? "Date de début *" : "Date de fin *"}
                </label>
                <input
                  type="date"
                  value={(formData as any)[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    (errors as any)[field]
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {(errors as any)[field] && (
                  <p className="text-red-500 text-sm mt-1">
                    {(errors as any)[field]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Création en cours..." : "Ajouter le Stagiaire"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
