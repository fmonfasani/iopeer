import { HttpMethod, QueryParams, httpClient } from '@IOpeer/pieces-common';
  import { wedofAuth } from '../../..';
  import {
    createAction,
    Property,
  } from '@IOpeer/pieces-framework';
  import { wedofCommon } from '../../common/wedof';
  
  export const listCertificationFolderSurveys = createAction({
    auth: wedofAuth,
    name: 'listCertificationFolderSurveys',
    displayName: 'Liste les enquÃªtes selon des critÃ¨res',
    description: "RÃ©cupÃ©rer l'ensemble des enquÃªtes de l'organisme de l'utilisateur connectÃ©",
    props: {
      certifInfo: Property.ShortText({
        displayName: 'NÂ° certifInfo',
        description: "Permet de n'obtenir que les enquÃªtes liÃ©es Ã  la certification considÃ©rÃ©e",
        required: false,
      }),
      limit: Property.ShortText({
        displayName: "Nombre d'enquÃªtes",
        description: "Nombre d'Ã©lÃ©ments retournÃ© par requÃªte - par dÃ©faut 100",
        required: false,
      }),
      order: Property.StaticDropdown({
        displayName: "Ordre",
        description: "Tri les rÃ©sultats par ordre ascendant ou descendant",
        required: false,
        options: {
          options: [
            {
              value: 'asc',
              label: 'Ascendant',
            },
            {
              value: 'desc',
              label: 'Descendant',
            },
          ],
          disabled: false,
        },
      }),
      page: Property.Number({
        displayName: 'NÂ° de page de la requÃªte',
        description: 'Par dÃ©faut : 1',
        defaultValue: 1,
        required: false,
      }),
      state: Property.StaticDropdown({
        displayName: "Etat",
        description: "Permet de n'obtenir que les enquÃªtes en fonction de l'Ã©tat considÃ©rÃ©",
        required: false,
        options: {
          options: [
            {
              value: 'all',
              label: 'Tous',
            },
            {
              value: 'created',
              label: 'CrÃ©Ã©',
            },
            {
              value: 'beforeCertificationSuccess',
              label: 'Avant la rÃ©ussite de la certification',
            },
            {
              value: 'afterSixMonthsCertificationSuccess',
              label: 'Six mois aprÃ¨s la rÃ©ussite de la certification',
            },
            {
              value: 'finished',
              label: 'TerminÃ©',
            },
          ],
          disabled: false,
        },
      }),
    },
  
    async run(context) {
      const params = {
        certifInfo: context.propsValue.certifInfo ?? null,
        limit: context.propsValue.limit ?? null,
        page: context.propsValue.page ?? null,
        state: context.propsValue.state ?? null,
        order:context.propsValue.order ?? null,
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
          url: wedofCommon.baseUrl + '/surveys',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
    },
  });
