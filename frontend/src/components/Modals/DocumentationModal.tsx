import React, { useState } from 'react';
import { HelpCircle, BookOpen, X } from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentationModal({ isOpen, onClose }: DocumentationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-6 w-6 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documentation de Stagiaire360</h2>
        </div>

        {/* Introduction */}
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Bienvenue dans la documentation de Stagiaire360. Cette section vous guide à travers toutes les fonctionnalités de l’application et vous montre comment les utiliser efficacement.
        </p>

        {/* Table des matières */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Table des matières</h3>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            <li>Dashboard</li>
            <li>Stagiaires</li>
            <li>Encadreurs</li>
            <li>Projets</li>
            <li>Kanban</li>
            <li>Rapports</li>
            <li>Paramètres</li>
          </ul>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <section>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-orange-500" /> Dashboard
            </h4>
            <p className="text-gray-700 dark:text-gray-300">
              Le Dashboard offre une vue d’ensemble de tous les stagiaires, projets et rapports. Vous pouvez visualiser rapidement les indicateurs clés.
            </p>
          </section>

          <section>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-orange-500" /> Stagiaires
            </h4>
            <p className="text-gray-700 dark:text-gray-300">
              Ici vous pouvez gérer les informations des stagiaires, ajouter de nouveaux profils, modifier ou supprimer des stagiaires existants.
            </p>
          </section>

          <section>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-orange-500" /> Encadreurs
            </h4>
            <p className="text-gray-700 dark:text-gray-300">
              Cette section permet aux administrateurs de gérer les encadreurs : création de profils, modification des informations et assignation aux projets.
            </p>
          </section>

          <section>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-orange-500" /> Projets
            </h4>
            <p className="text-gray-700 dark:text-gray-300">
              Vous pouvez consulter et créer des projets, suivre l’avancement et gérer les tâches assignées aux stagiaires.
            </p>
          </section>

          <section>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-orange-500" /> Kanban
            </h4>
            <p className="text-gray-700 dark:text-gray-300">
              Le tableau Kanban permet de suivre visuellement l’avancement des tâches et projets. Déplacez les tâches entre colonnes pour suivre leur statut.
            </p>
          </section>

          <section>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-orange-500" /> Rapports
            </h4>
            <p className="text-gray-700 dark:text-gray-300">
              Génération et consultation des rapports des stagiaires et projets. Vous pouvez exporter les rapports au format PDF, CSV ou JSON.
            </p>
          </section>

          <section>
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-orange-500" /> Paramètres
            </h4>
            <p className="text-gray-700 dark:text-gray-300">
              Modifiez votre profil, changez votre mot de passe et configurez les notifications selon vos préférences.
            </p>
          </section>
        </div>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Pour des détails plus avancés, consultez la documentation complète fournie par votre administrateur.
        </p>
      </div>
    </div>
  );
}
