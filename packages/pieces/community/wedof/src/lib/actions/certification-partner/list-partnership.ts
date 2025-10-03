import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const listPartnerships = createAction({
  auth: wedofAuth,
  name: 'listPartnerships',
  displayName: "Lister les partenariats",
  description: "RÃ©cupÃ¨re l'ensemble des partenariats d'une certification",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'NÂ° certifInfo',
      description: 'Identifiant de la certification',
      required: true,
    }),
    certifier: Property.ShortText({
      displayName: 'NÂ° Siret Certificateur',
      required: false,
    }),
    certifierAccessState: Property.StaticDropdown({
      displayName: 'Ã‰tat d\'accÃ¨s du certificateur',
      required: false,
      options: {
        options: [
            { label: 'Tous', value: 'all' },
            { label: 'En attente', value: 'waiting' },
            { label: 'AcceptÃ©', value: 'accepted' },
            { label: 'RefusÃ©', value: 'refused' },
            { label: 'TerminÃ©', value: 'terminated' },
            { label: 'Aucun', value: 'none' },
          ]
      }
    }),
    compliance: Property.StaticDropdown({
      displayName: 'ConformitÃ©',
      required: false,
      options: {
        options: [
            { label: 'Tous', value: 'all' },
            { label: 'Conforme', value: 'compliant' },
            { label: 'Partiellement conforme', value: 'partiallyCompliant' },
            { label: 'Non conforme', value: 'nonCompliant' },
            { label: 'En cours', value: 'inProgress' },
          ]
      }
    }),
    connectionIssue: Property.Checkbox({
      displayName: 'ProblÃ¨me de connexion',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limite',
      defaultValue: 100,
      description: 'Nombre maximal de rÃ©sultats Ã  retourner - 100 par dÃ©fault',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Ordre',
      required: false,
      options: {
        options: [
          { label: 'Ascendant', value: 'asc' },
          { label: 'Descendant', value: 'desc' },
        ]
      }
    }),
    page: Property.Number({
      displayName: 'Page',
      defaultValue: 1,
      description: 'NumÃ©ro de la page de rÃ©sultats - 1 par dÃ©fault',
      required: false,
    }),
    query: Property.ShortText({
      displayName: 'RequÃªte de recherche',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Trier par',
      required: false,
      defaultValue:'name',
      options: {
        options: [
          { label: "Nom de l'organisme", value: 'name' },
          { label: 'Ã‰tat', value: 'state' },
        ]
      }
    }),
    state: Property.StaticDropdown({
      displayName: 'Ã‰tat',
      required: false,
      defaultValue: 'all',
      options: {
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
            {
                value: 'all',
                label: 'Tous',
            },              
        ],
      }
    }),
  },
  async run(context) {
    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(context.propsValue)) {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    }

    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: wedofCommon.baseUrl +'/certifications/'+ context.propsValue.certifInfo +`/partners?${queryParams.toString()}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
