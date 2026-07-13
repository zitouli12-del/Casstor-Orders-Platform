/**
 * ============================================================
 * Ozon Status Dictionary
 * ============================================================
 */

export interface OzonStatus {
  label: string;
  color: string;
  final: boolean;
}

export const OZON_STATUS: Record<string, OzonStatus> = {
  PAID: {
    label: "Payé",
    color: "#9ccc65",
    final: false,
  },

  INVOICED: {
    label: "Facturé",
    color: "#25a0d7",
    final: false,
  },

  NEW_PARCEL: {
    label: "Nouveau Colis",
    color: "#25a0d7",
    final: false,
  },

  WAITING_PICKUP: {
    label: "Attente De Ramassage",
    color: "#ffba57",
    final: false,
  },

  PICKED_UP: {
    label: "Ramassé",
    color: "#ffba57",
    final: false,
  },

  SENT: {
    label: "Expédié",
    color: "#0000ff",
    final: false,
  },

  RECEIVED: {
    label: "Reçu",
    color: "#9ccc65",
    final: false,
  },

  DISTRIBUTION: {
    label: "Mise en distribution",
    color: "#25a0d7",
    final: false,
  },

  IN_PROGRESS: {
    label: "En cours",
    color: "#ffba57",
    final: false,
  },

  RETURNED: {
    label: "Retourné",
    color: "#eb1a00",
    final: true,
  },

  DELIVERED: {
    label: "Livré",
    color: "#9ccc65",
    final: true,
  },

  POSTPONED: {
    label: "Reporté",
    color: "#448aff",
    final: false,
  },

  NOANSWER: {
    label: "Pas de réponse + SMS",
    color: "#25a0d7",
    final: false,
  },

  OUT_OF_AREA: {
    label: "Hors-zone",
    color: "#00bcd4",
    final: false,
  },

  CANCELED: {
    label: "Annulé",
    color: "#eb1a00",
    final: true,
  },

  REFUSE: {
    label: "Refusé",
    color: "#EB1A00",
    final: true,
  },

  EN: {
    label: "Erreur Numero",
    color: "#ff8080",
    final: false,
  },

  INT: {
    label: "Client intéressé",
    color: "#ff05d5",
    final: false,
  },

  PROGRAMED: {
    label: "Programmé",
    color: "#0c72b0",
    final: false,
  },

  NOT_PAID: {
    label: "Non Payé",
    color: "#25a0d7",
    final: false,
  },

  RPO: {
    label: "Reporté aujourd'hui",
    color: "#ffe438",
    final: false,
  },

  SANS_ADRE: {
    label: "Sans adresse",
    color: "#ff0000",
    final: false,
  },

  DEPLA: {
    label: "Pas réponse + déplacement",
    color: "#0091ff",
    final: false,
  },

  REMBOURSED: {
    label: "Remboursé",
    color: "#a6b106",
    final: false,
  },

  SENT_TO_AGENCY: {
    label: "Envoyé à l'agence",
    color: "#0000ff",
    final: false,
  },

  RECEIVED_IN_AGENCY: {
    label: "Reçu En Agence De Livraison",
    color: "#25a0d7",
    final: false,
  },

  NOANSWER_DAY_2: {
    label: "Pas de réponse J+2",
    color: "#2530d0",
    final: false,
  },

  NOANSWER_DAY_3: {
    label: "Pas de réponse J+3",
    color: "#7472ee",
    final: false,
  },

  DEPLA_DAY_2: {
    label: "Pas réponse + déplacement J+2",
    color: "#d98230",
    final: false,
  },

  DEPLA_DAY_3: {
    label: "Pas réponse + déplacement J+3",
    color: "#ddbe69",
    final: false,
  },

  BAM_SEIZED: {
    label: "Saisi par Barid Al-Maghrib",
    color: "#8e0101",
    final: false,
  },

  PRE_PICKED_UP: {
    label: "Pré ramassé",
    color: "#d7c7f5",
    final: false,
  },

  DAMAGED: {
    label: "Endommagé",
    color: "#ec3609",
    final: false,
  },

  DELAYED: {
    label: "Retardé",
    color: "#ff0000",
    final: false,
  },

  VLMN: {
    label: "Livraison sous conditions",
    color: "#d97517",
    final: false,
  },

  SCTR: {
    label: "Hors Secteur",
    color: "#000000",
    final: false,
  },

  NCVRT: {
    label: "Zone Non-couverte",
    color: "#000000",
    final: false,
  },
};