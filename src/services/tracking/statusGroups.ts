export const STATUS_GROUPS = {
  preparing: [
    "Programmé",
    "Reçu",
    "Reçu En Agence De Livraison",
    "Pré ramassé",
    "Ramassé",
    "Envoyé à l'agence",
  ],

  inDelivery: [
    "Expédié",
    "expédier par AMANA",
    "En Voyage",
    "En cours",
    "Mise en distribution",
    "Livraison sous conditions",
    "client intéressé",
  ],

  noAnswer: [
    "Injoignable",
    "Injoignable (SUIVI)",
    "Boite Vocal",
    "Boite Vocal (SUIVI)",
    "Pas de réponse + SMS",
    "Pas de réponse J+2",
    "Pas de réponse J+3",
    "Pas de reponse (SUIVI)",
    "pas réponse + déplacement",
    "pas réponse + déplacement J+2",
    "pas réponse + déplacement J+3",
    "Erreur Numero",
  ],

  postponed: [
    "Reporté",
    "Reporté (SUIVI)",
    "reporté aujourd'hui",
    "Retardé",
  ],

  returned: [
    "Refusé",
    "Retourné",
    "En retour par AMANA",
    "Annulé",
    "Annulé (SUIVI)",
    "Remboursé",
    "sans adresse",
    "Hors Secteur",
    "Zone Non-couverte",
    "Hors-zone",
  ],

  delivered: [
    "Livré",
  ],
} as const;