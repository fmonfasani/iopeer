import {
  httpClient,
  HttpMethod,
  QueryParams,
} from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const searchRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'listRegistrationFolders',
  displayName: 'Rechercher un ou plusieurs dossiers de formation',
  description:
    'Liste les dossiers de formation en fonction des critÃ¨res sÃ©lectionnÃ©s',
  props: {
    query: Property.ShortText({
      displayName: 'Recherche',
      description: 'Nom, prÃ©nom, NÂ° de dossier, NÂ° de certification etc..',
      required: false,
    }),
    period: wedofCommon.period,
    periodForm: Property.DynamicProperties({
      description: '',
      displayName: 'ez',
      required: true,
      refreshers: ['period'],
      props: async ({ period }) => {
        const _period = period as unknown as string;
        const props: DynamicPropsValue = {};
        if (_period === 'custom') {
          props['since'] = Property.DateTime({
            displayName: '(PÃ©riode) Entre le',
            description: 'Date au format YYYY-MM-DD',
            required: true,
          });
          props['until'] = Property.DateTime({
            displayName: "(PÃ©riode) et jusqu'au",
            description: 'Date au format YYYY-MM-DD',
            required: true,
          });
        } else if (
          ['next', 'future', 'tomorrow'].some((v) =>
            _period.toLowerCase().includes(v)
          )
        ) {
          props['filterOnStateDate'] = wedofCommon.filterOnStateDateFuture;
        } else if (_period) {
          props['filterOnStateDate'] = wedofCommon.filterOnStateDate;
        }
        return props;
      },
    }),
    type: wedofCommon.type,
    state: wedofCommon.state,
    billingState: wedofCommon.billingState,
    controlState: wedofCommon.controlState,
    certificationFolderState: wedofCommon.certificationFolderState,
    proposalCode: Property.ShortText({
      displayName: 'Code de proposition commercial',
      description: 'Code de la proposition commercial Wedof associÃ©',
      required: false,
    }),
    siret: Property.ShortText({
      displayName: 'Siret',
      description:
        "Permet de n'obtenir que les dossiers appartenant Ã  l'organisme de siret considÃ©rÃ© - par dÃ©faut l'organisme de l'utilisateur courant",
      required: false,
    }),
    certifInfo: Property.ShortText({
      displayName: 'Certification',
      description: 'Filtrer par certification',
      required: false,
    }),
    columnId: Property.ShortText({
      displayName: 'ID de colonne',
      description: 'Identifiant pour affichage personnalisÃ©',
      required: false,
    }),
    completionRate: Property.StaticDropdown({
      displayName: 'Taux dâ€™assiduitÃ©',
      description:
        "Permet de n'obtenir que les dossiers dont le taux d'assiduitÃ© choisi",
      required: false,
      options: {
        options: [
          { label: '0%', value: '0' },
          { label: '< 25%', value: '25<' },
          { label: '25% <> 80%', value: '25<>80' },
          { label: '> 80%', value: '>80' },
          { label: '100%', value: '100' },
        ],
      },
    }),
    daysSinceLastUpdatedCompletionRate: Property.ShortText({
      displayName: "Jours sans mise Ã  jour d'assiduitÃ©",
      description:
        "Permet de n'obtenir que les dossiers pour lesquels le taux d'avancement n'a pas Ã©tÃ© mis Ã  jour depuis plus de X jours",
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format de sortie',
      required: false,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'CSV', value: 'csv' },
        ],
      },
    }),
    messageState: Property.StaticDropdown({
      displayName: 'Ã‰tat du message',
      description:
        "Permet de n'obtenir que les dossiers liÃ©s Ã  l'Ã©tat d'envoi d'un message considÃ©rÃ© - par dÃ©faut tous les dossiers sont retournÃ©s",
      required: false,
      options: {
        options: [
          { label: 'Message envoyÃ©', value: 'sent' },
          { label: 'Message non envoyÃ©', value: 'notSent' },
          {
            label: 'Message non envoyÃ© (non autorisÃ©)',
            value: 'notSentUnauthorized',
          },
          {
            label: 'Message non envoyÃ© (conditions renforcÃ©es)',
            value: 'notSentEnforcedConditions',
          },
          { label: "Echec de l'envoi", value: 'failed' },
          { label: 'Envoi programmÃ©', value: 'scheduled' },
        ],
      },
    }),
    messageTemplate: Property.ShortText({
      displayName: 'ModÃ¨le de message',
      description:
        "Permet de n'obtenir que les dossiers pour lequels un message issue du modÃ¨le considÃ©rÃ© a Ã©tÃ© crÃ©Ã© - par dÃ©faut aucun filtre",
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Ordre de tri',
      required: false,
      options: {
        options: [
          { label: 'Ascendant', value: 'asc' },
          { label: 'Descendant', value: 'desc' },
        ],
      },
    }),
    organismType: Property.StaticDropdown({
      displayName: 'Type dâ€™organisme',
      required: false,
      options: {
        options: [
          { label: 'Moi', value: 'self' },
          { label: 'Partenaires', value: 'partners' },
        ],
      },
    }),
    sort: Property.StaticDropdown({
      displayName: 'CritÃ¨re de tri',
      description: 'Tri les rÃ©sultats sur un critÃ¨re',
      required: false,
      options: {
        options: [
          { label: 'PrÃ©nom', value: 'firstName' },
          { label: 'Nom', value: 'lastName' },
          { label: 'DerniÃ¨re mise Ã  jour', value: 'lastUpdate' },
          { label: 'ID', value: 'id' },
        ],
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Recherche libre sur les tags',
      required: false,
    }),
    trainingActionId: Property.ShortText({
      displayName: "ID de l'action de formation",
      description:
        "Permet de n'obtenir que les dossiers liÃ©s Ã  l'action de formation considÃ©rÃ©e",
      required: false,
    }),
    trainingId: Property.ShortText({
      displayName: 'ID de la formation',
      description:
        "Permet de n'obtenir que les dossiers liÃ©s Ã  la formation considÃ©rÃ©e",
      required: false,
    }),
    sessionId: Property.ShortText({
      displayName: 'ID de la session',
      description:
        "Permet de n'obtenir que les dossiers liÃ©s Ã  la session considÃ©rÃ©e",
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Nombre de dossiers de formation',
      description:
        'Nombre de dossiers de formation maximum qui seront retournÃ©s par requÃªte',
      defaultValue: 100,
      required: false,
    }),
    page: Property.Number({
      displayName: 'NÂ° de page de la requÃªte',
      description: 'Par dÃ©faut : 1',
      defaultValue: 1,
      required: false,
    }),
  },

  async run(context) {
    const props = context.propsValue;
    const params = {
      query: props.query ?? null,
      limit: props.limit ?? null,
      page: props.page ?? null,
      controlState: props.controlState ?? null,
      state: props.state ?? null,
      certificationFolderState: props.certificationFolderState ?? null,
      billingState: props.billingState ?? null,
      type: props.type ?? null,
      period: props.period ?? null,
      proposalCode: props.proposalCode ?? null,
      siret: props.siret ?? null,
      certifInfo: props.certifInfo ?? null,
      columnId: props.columnId ?? null,
      completionRate: props.completionRate ?? null,
      daysSinceLastUpdatedCompletionRate:
        props.daysSinceLastUpdatedCompletionRate ?? null,
      format: props.format ?? null,
      messageState: props.messageState ?? null,
      messageTemplate: props.messageTemplate ?? null,
      order: props.order ?? null,
      organismType: props.organismType ?? null,
      sort: props.sort ?? null,
      tags: props.tags ?? null,
      trainingActionId: props.trainingActionId ?? null,
      trainingId: props.trainingId ?? null,
      sessionId: props.sessionId ?? null,
      since: props.periodForm['since']
        ? dayjs(props.periodForm['since'])
            .startOf('day')
            .format('YYYY-MM-DDTHH:mm:ssZ')
        : null,
      until: props.periodForm['until']
        ? dayjs(props.periodForm['until'])
            .endOf('day')
            .format('YYYY-MM-DDTHH:mm:ssZ')
        : null,
      filterOnStateDate: props.periodForm['filterOnStateDate'] ?? null,
    };
    const queryParams: QueryParams = {};
    Object.keys(params).forEach((value) => {
      const key = value as keyof typeof params;
      if (params[key] != null && params[key] != undefined) {
        queryParams[value] = params[key] as string;
      }
    });
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        queryParams: queryParams,
        url: wedofCommon.baseUrl + '/registrationFolders',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
