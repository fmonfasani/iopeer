import { Property } from '@IOpeer/pieces-framework';
import { HttpMethod, httpClient } from '@IOpeer/pieces-common';

export const wedofCommon = {
  baseUrl: 'https://www.wedof.fr/api',
  host: 'https://www.wedof.fr/api',

  subscribeWebhook: async (
    events: string[],
    webhookUrl: string,
    apiKey: string,
    name: string
  ) => {
    const request = {
      method: HttpMethod.POST,
      url: `${wedofCommon.baseUrl}/webhooks`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'User-Agent': 'IOpeer',
      },
      body: {
        url: webhookUrl,
        events: events,
        name: name,
        secret: null,
        enabled: true,
        ignoreSsl: false,
      },
    };
    const response = await httpClient.sendRequest(request);
    if (response.status !== 201) {
      let errorMessage = `Ã‰chec de la crÃ©ation du webhook. Code de statut reÃ§u: ${response.status}`;
      if (response.body && typeof response.body === 'object') {
        const errorBody = response.body as any;
        if (errorBody.detail) {
          errorMessage += `. Erreur: ${errorBody.detail}`;
        }
        if (errorBody.violations && Array.isArray(errorBody.violations)) {
          const violations = errorBody.violations
            .map((v: any) => `${v.propertyPath}: ${v.title}`)
            .join(', ');
          errorMessage += `. DÃ©tails: ${violations}`;
        }
        if (!errorBody.detail && !errorBody.violations) {
          errorMessage += `. RÃ©ponse: ${JSON.stringify(response.body)}`;
        }
      }
      throw new Error(errorMessage);
    }
    return response.body.id;
  },

  handleWebhookSubscription: async (
    events: string[],
    context: any,
    name: string
  ) => {
    const id = await context.store.get('_webhookId');
    if (id === null) {
      try {
        const webhookId = await wedofCommon.subscribeWebhook(
          events,
          context.webhookUrl,
          context.auth as string,
          name
        );
        await context.store.put('_webhookId', webhookId);
      } catch (error) {
        console.error('Erreur lors de la crÃ©ation du webhook:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur inconnue';
        throw new Error(`Ã‰chec de la crÃ©ation du webhook: ${errorMessage}`);
      }
    } else {
      console.log('/////////// webhook already exist ////');
    }
  },

  unsubscribeWebhook: async (webhookId: string, apiKey: string) => {
    const request = {
      method: HttpMethod.DELETE,
      url: `${wedofCommon.baseUrl}/webhooks/${webhookId}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'User-Agent': 'IOpeer',
      },
    };
    return await httpClient.sendRequest(request);
  },

  state: Property.StaticMultiSelectDropdown({
    displayName: 'Etat du dossier de formation',
    required: false,
    options: {
      options: [
        {
          value: 'notProcessed',
          label: 'Non traitÃ©',
        },
        {
          value: 'validated',
          label: 'ValidÃ©',
        },
        {
          value: 'waitingAcceptation',
          label: "ValidÃ© (En cours d'instruction par France Travail)",
        },
        {
          value: 'accepted',
          label: 'AcceptÃ©',
        },
        {
          value: 'inTraining',
          label: 'En formation',
        },
        {
          value: 'terminated',
          label: 'Sortie de formation',
        },
        {
          value: 'serviceDoneDeclared',
          label: 'Service fait dÃ©clarÃ©',
        },
        {
          value: 'serviceDoneValidated',
          label: 'Service fait validÃ©',
        },
        {
          value: 'canceledByAttendee',
          label: 'AnnulÃ© (par le titulaire)',
        },
        {
          value: 'canceledByAttendeeNotRealized',
          label: 'Annulation titulaire (non rÃ©alisÃ©)',
        },
        {
          value: 'canceledByOrganism',
          label: "AnnulÃ© (par l'organisme)",
        },
        {
          value: 'canceledByFinancer',
          label: 'AnnulÃ© (par le financeur)',
        },
        {
          value: 'rejectedWithoutTitulaireSuite',
          label: 'AnnulÃ© sans suite',
        },
        {
          value: 'refusedByAttendee',
          label: 'Refus titulaire',
        },
        {
          value: 'refusedByOrganism',
          label: "RefusÃ© (par l'organisme)",
        },
        {
          value: 'refusedByFinancer',
          label: 'RefusÃ© (par le financeur)',
        },
      ],
      disabled: false,
    },
  }),

  partnershipState: Property.StaticDropdown({
    displayName: 'Ã‰tat du partenariat de certification',
    required: false,
    options: {
      disabled: false,
      options: [
        {
          value: 'processing',
          label: 'Demande en traitement',
        },
        {
          value: 'active',
          label: 'Partenariat actif',
        },
        {
          value: 'aborted',
          label: 'Demande abondonnÃ©e',
        },
        {
          value: 'refused',
          label: 'Demande refusÃ©e',
        },
        {
          value: 'suspended',
          label: 'Partenariat suspendu',
        },
        {
          value: 'revoked',
          label: 'Partenariat rÃ©voquÃ©',
        },
      ],
    },
  }),

  habilitation: Property.StaticDropdown({
    displayName: 'Habilitation du partenaire',
    required: false,
    options: {
      disabled: false,
      options: [
        {
          value: 'evaluate',
          label: 'Habilitation pour organiser lâ€™Ã©valuation',
        },
        {
          value: 'train',
          label: 'Habilitation pour former',
        },
        {
          value: 'train_evaluate',
          label: 'Habilitation pour former et organiser lâ€™Ã©valuation',
        },
      ],
    },
  }),

  compliance: Property.StaticDropdown({
    displayName: 'ConformitÃ©',
    required: false,
    options: {
      options: [
        { label: 'Conforme', value: 'compliant' },
        { label: 'Partiellement Conforme', value: 'partiallyCompliant' },
        { label: 'Non Conforme', value: 'nonCompliant' },
      ],
    },
  }),

  events: Property.StaticMultiSelectDropdown({
    displayName: 'Ã‰vÃ©nement sur le dossier de formation',
    required: true,
    options: {
      options: [
        {
          value: 'registrationFolder.created',
          label: 'CrÃ©Ã©',
        },
        {
          value: 'registrationFolder.updated',
          label: 'Mis Ã  jour',
        },
        {
          value: 'registrationFolder.notProcessed',
          label: 'Non traitÃ©',
        },
        {
          value: 'registrationFolder.validated',
          label: 'ValidÃ©',
        },
        {
          value: 'registrationFolder.waitingAcceptation',
          label: "ValidÃ© (En cours d'instruction par France Travail)",
        },
        {
          value: 'registrationFolder.accepted',
          label: 'AcceptÃ©',
        },
        {
          value: 'registrationFolder.inTraining',
          label: 'En formation',
        },
        {
          value: 'registrationFolder.terminated',
          label: 'Sortie de formation',
        },
        {
          value: 'registrationFolder.serviceDoneDeclared',
          label: 'Service fait dÃ©clarÃ©',
        },
        {
          value: 'registrationFolder.serviceDoneValidated',
          label: 'Service fait validÃ©',
        },
        {
          value: 'registrationFolderFile.added',
          label: 'Document ajoutÃ©',
        },
        {
          value: 'registrationFolderFile.updated',
          label: 'Document mis a jour',
        },
        {
          value: 'registrationFolderFile.deleted',
          label: 'Document supprimÃ©',
        },
        {
          value: 'registrationFolderFile.valid',
          label: 'Document validÃ©',
        },
        {
          value: 'registrationFolderFile.refused',
          label: 'Document refusÃ©',
        },
        {
          value: 'registrationFolderFile.toReview',
          label: 'Document Ã  vÃ©rifier',
        },
        {
          value: 'registrationFolder.canceledByAttendee',
          label: 'AnnulÃ© (par le titulaire)',
        },
        {
          value: 'registrationFolder.canceledByAttendeeNotRealized',
          label: 'Annulation titulaire (non rÃ©alisÃ©)',
        },
        {
          value: 'registrationFolder.canceledByOrganism',
          label: "AnnulÃ© (par l'organisme)",
        },
        {
          value: 'registrationFolder.canceledByFinancer',
          label: 'AnnulÃ© (par le financeur)',
        },
        {
          value: 'registrationFolder.rejectedWithoutTitulaireSuite',
          label: 'AnnulÃ© sans suite',
        },
        {
          value: 'registrationFolder.refusedByAttendee',
          label: 'Refus titulaire',
        },
        {
          value: 'registrationFolder.refusedByOrganism',
          label: "RefusÃ© (par l'organisme)",
        },
        {
          value: 'registrationFolder.refusedByFinancer',
          label: 'RefusÃ© (par le financeur)',
        },
        {
          value: 'registrationFolder.refusedByFinancer',
          label: 'RefusÃ© (par le financeur)',
        },
        {
          value: 'registrationFolderBilling.notBillable',
          label: 'Pas facturable',
        },
        {
          value: 'registrationFolderBilling.depositWait',
          label: 'Acompte en attente de dÃ©pot',
        },
        {
          value: 'registrationFolderBilling.depositPaid',
          label: 'Acompte dÃ©posÃ©',
        },
        {
          value: 'registrationFolderBilling.toBill',
          label: 'A facturer',
        },
        {
          value: 'registrationFolderBilling.billed',
          label: 'FacturÃ©',
        },
        {
          value: 'registrationFolderBilling.paid',
          label: 'PayÃ©',
        },
      ],
      disabled: false,
    },
  }),

  certificationEvents: Property.StaticMultiSelectDropdown({
    displayName: 'Ã‰vÃ©nement sur le dossier de certification',
    required: true,
    options: {
      options: [
        {
          value: 'certificationFolder.created',
          label: 'CrÃ©Ã©',
        },
        {
          value: 'certificationFolder.updated',
          label: 'Mis Ã  jour',
        },
        {
          value: 'certificationFolder.accrochageOk',
          label: 'Accrochage rÃ©ussi',
        },
        {
          value: 'certificationFolder.accrochageKo',
          label: 'Accrochage en erreur',
        },
        {
          value: 'certificationFolder.toRegister',
          label: 'Ã€ enregistrer',
        },
        {
          value: 'certificationFolder.registered',
          label: 'EnregistrÃ©',
        },
        {
          value: 'certificationFolder.toTake',
          label: 'PrÃªt Ã  passer',
        },
        {
          value: 'certificationFolder.toControl',
          label: 'Ã€ contrÃ´ler',
        },
        {
          value: 'certificationFolder.success',
          label: 'RÃ©ussi',
        },
        {
          value: 'certificationFolder.refused',
          label: 'RefusÃ©',
        },
        {
          value: 'certificationFolder.failed',
          label: 'Ã‰chouÃ©',
        },
        {
          value: 'certificationFolder.aborted',
          label: 'AbandonnÃ©',
        },
        {
          value: 'certificationFolder.inTrainingStarted',
          label: 'Formation dÃ©marrÃ©e',
        },
        {
          value: 'certificationFolder.inTrainingEnded',
          label: 'Formation terminÃ©e',
        },
      ],
      disabled: false,
    },
  }),

  forceMajeureAbsence: Property.StaticDropdown({
    displayName: 'Absence pour raison de force majeure',
    description: "Si absence pour raison de force majeure, 'Oui', sinon 'Non'",
    required: false,
    defaultValue: false,
    options: {
      options: [
        {
          value: true,
          label: 'Oui',
        },
        {
          value: false,
          label: 'Non',
        },
      ],
      disabled: false,
    },
  }),

  europeanLanguageLevel: Property.StaticDropdown({
    displayName: 'Nomenclature europÃ©eenne pour les certifications de langues',
    required: false,
    defaultValue: null,
    options: {
      options: [
        { label: 'C2', value: 'C2' },
        { label: 'C1', value: 'C1' },
        { label: 'B2', value: 'B2' },
        { label: 'B1', value: 'B1' },
        { label: 'A2', value: 'A2' },
        { label: 'A1', value: 'A1' },
        { label: 'INSUFFISANT', value: 'INSUFFISANT' },
      ],
      disabled: false,
    },
  }),

  gradePass: Property.StaticDropdown({
    displayName: 'Ajoute une mention au dossier de certification',
    required: false,
    defaultValue: null,
    options: {
      options: [
        { label: 'SANS MENTION', value: 'SANS_MENTION' },
        { label: 'MENTION ASSEZ BIEN', value: 'MENTION_ASSEZ_BIEN' },
        { label: 'MENTION BIEN', value: 'MENTION_BIEN' },
        { label: 'MENTION TRES BIEN', value: 'MENTION_TRES_BIEN' },
        {
          label: 'MENTION TRES BIEN AVEC FELICITATIONS',
          value: 'MENTION_TRES_BIEN_AVEC_FELICITATIONS_DU_JURY',
        },
      ],
      disabled: false,
    },
  }),

  examinationType: Property.StaticDropdown({
    displayName: "Type de passage de l'examen",
    required: false,
    defaultValue: null,
    options: {
      options: [
        {
          value: 'A_DISTANCE',
          label: 'Ã€ distance',
        },
        {
          value: 'EN_PRESENTIEL',
          label: 'En prÃ©sentiel',
        },
        {
          value: 'MIXTE',
          label: 'Mixte',
        },
      ],
      disabled: false,
    },
  }),

  controlState: Property.StaticMultiSelectDropdown({
    displayName: 'Etat de controle',
    description:
      "Permet de n'obtenir que les dossiers dans l'Ã©tat de contrÃ´le considÃ©rÃ©",
    required: false,
    options: {
      options: [
        {
          value: 'notInControl',
          label: 'Aucun contrÃ´le',
        },
        {
          value: 'inControl',
          label: 'En cours de contrÃ´le',
        },
        {
          value: 'released',
          label: 'ContrÃ´le terminÃ©',
        },
      ],
      disabled: false,
    },
  }),

  certificationFolderState: Property.StaticMultiSelectDropdown({
    displayName: 'Ã‰tat du dossier de certification',
    required: false,
    options: {
      options: [
        {
          label: 'Tous',
          value: 'all',
        },
        {
          label: 'Ã€ enregistrer',
          value: 'toRegister',
        },
        {
          label: 'EnregistrÃ©',
          value: 'registered',
        },
        {
          label: 'PrÃªt Ã  passer',
          value: 'toTake',
        },
        {
          label: 'Ã€ contrÃ´ler',
          value: 'toControl',
        },
        {
          label: 'RÃ©ussi',
          value: 'success',
        },
        {
          label: 'Ã€ repasser',
          value: 'toRetake',
        },
        {
          label: 'Ã‰chouÃ©',
          value: 'failed',
        },
        {
          label: 'RefusÃ©',
          value: 'refused',
        },
        {
          label: 'AbandonnÃ©',
          value: 'aborted',
        },
        {
          label: 'Ã€ enregistrer',
          value: 'toRegister',
        },
      ],
      disabled: false,
    },
  }),

  billingState: Property.StaticMultiSelectDropdown({
    displayName: 'Ã‰tat de facturation',
    required: false,
    options: {
      options: [
        {
          label: 'Tous',
          value: 'all',
        },
        {
          label: 'Pas facturable',
          value: 'notBillable',
        },
        {
          label: 'En attente du virement',
          value: 'depositWait',
        },
        {
          label: 'Virement effectuÃ©',
          value: 'depositPaid',
        },
        {
          label: 'A facturer',
          value: 'toBill',
        },
        {
          label: 'FacturÃ©',
          value: 'billed',
        },
        {
          label: 'PayÃ©',
          value: 'paid',
        },
      ],
      disabled: false,
    },
  }),

  type: Property.StaticMultiSelectDropdown({
    displayName: 'Financement',
    required: false,
    options: {
      options: [
        {
          label: 'Tous',
          value: 'all',
        },
        {
          label: 'CPF',
          value: 'cpf',
        },
        {
          label: 'Kairos (AIF)',
          value: 'kairosAif',
        },
        {
          label: 'OPCO',
          value: 'opco',
        },
        {
          label: 'Entreprise',
          value: 'company',
        },
        {
          label: 'Autofinancement',
          value: 'individual',
        },
        {
          label: 'PÃ´le Emploi (Autres)',
          value: 'poleEmploi',
        },
      ],
      disabled: false,
    },
  }),

  period: Property.StaticDropdown({
    displayName: 'PÃ©riode',
    required: false,
    defaultValue: null,
    options: {
      options: [
        {
          label: 'PersonnalisÃ©e',
          value: 'custom',
        },
        {
          label: 'Demain',
          value: 'tomorrow',
        },
        {
          label: "Aujourd'hui",
          value: 'today',
        },
        {
          label: 'Hier',
          value: 'yesterday',
        },
        {
          label: '7 derniers jours',
          value: 'rollingWeek',
        },
        {
          label: '7 prochains jours',
          value: 'rollingWeekFuture',
        },
        {
          label: 'Semaine prochaine',
          value: 'nextWeek',
        },
        {
          label: 'Semaine prÃ©cÃ©dente',
          value: 'previousWeek',
        },
        {
          label: 'Semaine courante',
          value: 'currentWeek',
        },
        {
          label: '30 derniers jours',
          value: 'rollingMonth',
        },
        {
          label: '30 prochains jours',
          value: 'rollingMonthFuture',
        },
        {
          label: 'Mois prochain',
          value: 'nextMonth',
        },
        {
          label: 'Mois prÃ©cÃ©dent',
          value: 'previousMonth',
        },
        {
          label: 'Mois courant',
          value: 'currentMonth',
        },
        {
          label: '12 derniers mois',
          value: 'rollingYear',
        },
        {
          label: '12 prochains mois',
          value: 'rollingYearFuture',
        },
        {
          label: 'AnnÃ©e prochaine',
          value: 'nextYear',
        },
        {
          label: 'AnnÃ©e prÃ©cÃ©dente',
          value: 'previousYear',
        },
        {
          label: 'AnnÃ©e courante',
          value: 'currentYear',
        },
        {
          label: 'PÃ©riode de facturation Wedof en cours',
          value: 'wedofInvoice',
        },
      ],
      disabled: false,
    },
  }),

  filterOnStateDate: Property.StaticDropdown({
    displayName: '(PÃ©riode) BasÃ© sur la date de',
    required: true,
    defaultValue: 'lastUpdate',
    options: {
      disabled: false,
      options: [
        {
          label: 'Date de mise Ã  jour',
          value: 'lastUpdate',
        },
        { 
          label: 'DerniÃ¨re mise Ã  jour', 
          value: 'updatedOn' },
        {
          label: 'Date de CrÃ©ation',
          value: 'createdOn',
        },
        {
          label: 'Passage Ã  Non TraitÃ©',
          value: 'notProcessedDate',
        },
        {
          label: 'Passage Ã  ValidÃ©',
          value: 'validatedDate',
        },
        {
          label: 'Passage Ã  Accepter',
          value: 'acceptedDate',
        },
        {
          label: 'Passage Ã  Entrer en formation',
          value: 'inTrainingDate',
        },
        {
          label: 'Passage Ã  Sortie de formation',
          value: 'terminatedDate',
        },
        {
          label: 'Passage Ã  Service fait DÃ©clarÃ©',
          value: 'serviceDoneDeclaredDate',
        },
        {
          label: 'Passage Ã  Service fait ValidÃ©',
          value: 'serviceDoneValidatedDate',
        },
        {
          label: 'Passage Ã  Facturer',
          value: 'billedDate',
        },
        {
          label: 'Passage Ã  Refus titulaire',
          value: 'refusedByAttendeeDate',
        },
        {
          label: "Passage Ã  RefusÃ© (par l'organisme)",
          value: 'refusedByOrganismDate',
        },
        {
          label: 'Passage Ã  AnnulÃ© (parle titulaire)',
          value: 'canceledByAttendeeDate',
        },
        {
          label: "Passage Ã  AnnulÃ© (par l'organisme)",
          value: 'canceledByOrganismDate',
        },
        {
          label: 'Passage Ã  Annulation titulaire (non rÃ©alisÃ©)',
          value: 'canceledByAttendeeNotRealizedDate',
        },
        {
          label: 'Passage Ã  AnnulÃ© sans suite',
          value: 'rejectedWithoutTitulaireSuiteDate',
        },
        {
          label: 'Date de dÃ©but de session',
          value: 'sessionStartDate',
        },
        {
          label: 'Date de fin de session',
          value: 'sessionEndDate',
        },
      ],
    },
  }),
  filterOnStateDateFuture: Property.StaticDropdown({
    displayName: '(PÃ©riode) BasÃ© sur la date de',
    required: true,
    defaultValue: 'sessionStartDate',
    options: {
      disabled: false,
      options: [
        {
          label: 'Date de dÃ©but de session',
          value: 'sessionStartDate',
        },
        {
          label: 'Date de fin de session',
          value: 'sessionEndDate',
        },
        {
          label: 'Date prÃ©visionnelle de paiment',
          value: 'paymentScheduledDate',
        },
      ],
    },
  }),

  filterOnStateDateCf: Property.StaticDropdown({
    displayName: '(PÃ©riode) BasÃ© sur la date de',
    required: true,
    defaultValue: 'stateLastUpdate',
    options: {
      disabled: false,
      options: [
        { 
          label: 'DerniÃ¨r changement dâ€™Ã©tat', 
          value: 'stateLastUpdate' },
        { 
          label: 'DerniÃ¨re mise Ã  jour', 
          value: 'updatedOn' },
        { 
          label: 'Passage Ã  Ã€ prendre en charge', 
          value: 'toTakeDate' },
        { 
          label: 'Passage Ã  Ã€ reprogrammer', 
          value: 'toRetakeDate' },
        { 
          label: 'Passage Ã  Ã€ contrÃ´ler', 
          value: 'toControlDate' },
        { 
          label: 'Passage Ã  Ã‰chec', 
          value: 'failedDate' },
        { 
          label: 'Passage Ã  SuccÃ¨s', 
          value: 'successDate' },
        { 
          label: 'Passage Ã  Ã€ inscrire', 
          value: 'toRegisterDate' },
        { 
          label: 'Passage Ã  Enregistrer', 
          value: 'registeredDate' },
        { 
          label: 'Passage Ã  RefusÃ©', 
          value: 'refusedDate' },
        { 
          label: 'Passage Ã  AbandonnÃ©', 
          value: 'abortedDate' },
        {
          label: 'Passage Ã  Non traitÃ©',
          value: 'notProcessedRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  ValidÃ©',
          value: 'validatedRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  AcceptÃ©',
          value: 'acceptedRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  En formation',
          value: 'inTrainingRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  Sortie de formation',
          value: 'terminatedRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  Service fait dÃ©clarÃ©',
          value: 'serviceDoneDeclaredRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  Service fait validÃ©',
          value: 'serviceDoneValidatedRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  Ã€ facturer',
          value: 'billedRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  RefusÃ© par le titulaire',
          value: 'refusedByAttendeeRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  RefusÃ© par lâ€™organisme',
          value: 'refusedByOrganismRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  AnnulÃ© par le titulaire',
          value: 'canceledByAttendeeRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  AnnulÃ© par lâ€™organisme',
          value: 'canceledByOrganismRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  Annulation non rÃ©alisÃ©e (titulaire)',
          value: 'canceledByAttendeeNotRealizedRegistrationFolderStateDate',
        },
        {
          label: 'Passage Ã  AnnulÃ© sans suite',
          value: 'rejectedWithoutTitulaireSuiteRegistrationFolderStateDate',
        },
        {
          label: 'Date de dÃ©but de session',
          value: 'sessionStartDateRegistrationFolderDate',
        },
        {
          label: 'Date de fin de session',
          value: 'sessionEndDateRegistrationFolderDate',
        },
        { label: 'Facturable par WEDOF', value: 'wedofInvoice' },
        { label: "Date d'inscription", value: 'enrollmentDate' },
        { label: "Date dÃ©but de l'examen", value: 'examinationDate' },
        { label: "Date fin de l'examen", value: 'examinationEndDate' },
      ],
    },
  }),

  filterOnStateDateFutureCf: Property.StaticDropdown({
    displayName: '(PÃ©riode) BasÃ© sur la date de',
    required: true,
    options: {
      disabled: false,
      options: [
        {
          label: "Date d'inscription",
          value: 'enrollmentDate',
        },
        {
          label: "Date dÃ©but de l'examen",
          value: 'examinationDate',
        },
        {
          label: "Date fin de l'examen",
          value: 'examinationEndDate',
        },
      ],
    },
  }),

  sort: Property.StaticDropdown({
    displayName: 'Tri sur critÃ¨re',
    required: true,
    defaultValue: 'stateLastUpdate',
    options: {
      disabled: false,
      options: [
        {
          label: "Date du dernier changement d'Ã©tat",
          value: 'stateLastUpdate',
        },
        {
          label: 'Date du dernier dossier mis Ã  rÃ©ussi',
          value: 'successDate',
        },
        {
          label: 'ID de base de donnÃ©e',
          value: 'id',
        },
      ],
    },
  }),

  order: Property.StaticDropdown({
    displayName: 'Ordre',
    description:
      'Tri les rÃ©sultats par ordre ascendant ou descendant - par dÃ©faut descendant',
    required: false,
    options: {
      disabled: false,
      options: [
        {
          label: 'Descendant',
          value: 'desc',
        },
        {
          label: 'Ascendant',
          value: 'asc',
        },
      ],
    },
  }),

  tasks: Property.StaticDropdown({
    displayName: 'Type de tÃ¢che',
    required: true,
    options: {
      disabled: false,
      options: [
        {
          label: 'TÃ©lÃ©phone',
          value: 'phone',
        },
        {
          label: 'Email',
          value: 'email',
        },
        {
          label: 'Meeting',
          value: 'meeting',
        },
        {
          label: 'Chat',
          value: 'chat',
        },
        {
          label: 'SMS',
          value: 'sms',
        },
        {
          label: 'Formation',
          value: 'training',
        },
        {
          label: 'Remarque',
          value: 'remark',
        },
        {
          label: 'Document',
          value: 'file',
        },
      ],
    },
  }),

  qualiopiIndicators: Property.StaticDropdown({
    displayName: 'AssociÃ©e Ã  Qualiopi',
    required: false,
    options: {
      disabled: false,
      options: [
        {
          label: 'Ind. 1 : Informations du public',
          value: 1,
        },
        {
          label: 'Ind. 2 : Indicateurs de rÃ©sultats',
          value: 2,
        },
        {
          label: 'Ind. 3 : Obtentions des certifications',
          value: 3,
        },
        {
          label: 'Ind. 4 : Analyse du besoin',
          value: 4,
        },
        {
          label: 'Ind. 5 : Objectifs de la prestation',
          value: 5,
        },
        {
          label: 'Ind. 6 : Mise en oeuvre de la prestation',
          value: 6,
        },
        {
          label: 'Ind. 7 : AdÃ©quation contenus / exigences',
          value: 7,
        },
        {
          label: "Ind. 8 : Positionnement Ã  l'entrÃ©e",
          value: 8,
        },
        {
          label: 'Ind. 9 : Condition de dÃ©roulement',
          value: 9,
        },
        {
          label: 'Ind. 10 : Adaptation de la prestation',
          value: 10,
        },
        {
          label: 'Ind. 11 : Atteinte des objectifs',
          value: 11,
        },
        {
          label: 'Ind. 12 : Engagement des bÃ©nÃ©ficiaires',
          value: 12,
        },
        {
          label: 'Ind. 13 : Coordination des apprentis',
          value: 13,
        },
        {
          label: 'Ind. 14 : Exercice de la citoyennetÃ©',
          value: 14,
        },
        {
          label: "Ind. 15 : Droits Ã  devoirs de l'apprenti",
          value: 15,
        },
        {
          label: 'Ind. 16 : PrÃ©sentation Ã  la certification',
          value: 16,
        },
        {
          label: 'Ind. 17 : Moyens humains et techniques',
          value: 17,
        },
        {
          label: 'Ind. 18 : Coordination des acteurs',
          value: 18,
        },
        {
          label: 'Ind. 19 : Ressources pÃ©dagogiques',
          value: 19,
        },
        {
          label: 'Ind. 20 : Personnels dÃ©diÃ©s',
          value: 20,
        },
        {
          label: 'Ind. 21 : CompÃ©tences des acteurs',
          value: 21,
        },
        {
          label: 'Ind. 22 : Gestion des compÃ©tences',
          value: 22,
        },
        {
          label: 'Ind. 23 : Veille lÃ©gale et rÃ©glementaire',
          value: 23,
        },
        {
          label: 'Ind. 24 : Veille emplois et mÃ©tiers',
          value: 24,
        },
        {
          label: 'Ind. 25 : Veille technologique',
          value: 25,
        },
        {
          label: 'Ind. 26 : Public en situation de handicap',
          value: 26,
        },
        {
          label: 'Ind. 27 : Sous-traitance et portage salarial',
          value: 27,
        },
        {
          label: 'Ind. 28 : Formation Situation de travail',
          value: 28,
        },
        {
          label: 'Ind. 29 : Insertion professionnelle',
          value: 29,
        },
        {
          label: 'Ind. 30 : Recueil des apprÃ©ciations',
          value: 30,
        },
        {
          label: 'Ind. 31 : Traitement des rÃ©clamations',
          value: 31,
        },
        {
          label: "Ind. 32 : Mesures d'amÃ©lioration continue",
          value: 32,
        },
      ],
    },
  }),

  cdcState: Property.StaticDropdown({
    displayName: "Ã‰tat de l'accrochage",
    description:
      "Permet de n'obtenir que les dossiers dans l'Ã©tat considÃ©rÃ© liÃ© Ã  l'export des dossiers - par dÃ©faut tous les dossiers sont retournÃ©s",
    required: false,
    options: {
      disabled: false,
      options: [
        {
          label: 'Tous',
          value: 'all',
        },
        {
          label: 'Jamais accrochÃ©',
          value: 'notExported',
        },
        {
          label: "EnvoyÃ© et en attente de l'accusÃ©",
          value: 'exported',
        },
        {
          label: 'Accrochage rÃ©ussi',
          value: 'processedOk',
        },
        {
          label: 'Accrochage en erreur',
          value: 'processedKo',
        },
      ],
    },
  }),
};
