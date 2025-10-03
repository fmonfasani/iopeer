import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const declareRegistrationFolderServicedone = createAction({
  auth: wedofAuth,
  name: 'declareRegistrationFolderServicedone',
  displayName: "Passer un dossier de formation Ã  l'Ã©tat : Service fait dÃ©clarÃ©",
  description:
    "Passe le dossier dans l'Ã©tat 'service fait dÃ©clarÃ©' s'il est dans l'Ã©tat 'sortie de formation' ou dans l'Ã©tat 'en formation'. Si depuis l'Ã©tat 'en formation', le passage Ã  l'Ã©tat intermÃ©diaire 'sortie de formation' se fera automatiquement.",
  props: {
    externalId: Property.ShortText({
      displayName: 'NÂ° du dossier de formation',
      description:
        'SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de formation',
      required: true,
    }),
    absenceDuration: Property.Number({
      displayName: "durÃ©e d'absence",
      description:
        "La durÃ©e d'une Ã©ventuelle absence en heures. 0 si aucune absence.",
      required: false,
      defaultValue: 0,
    }),
    forceMajeureAbsence: wedofCommon.forceMajeureAbsence,
    trainingDuration: Property.Number({
      displayName: 'DurÃ©e totale de la formation',
      description:
        "PrÃ©cise la durÃ©e totale de la formation afin de calculer le % d'absence. Si rien n'est prÃ©cisÃ©, rÃ©cupÃ¨re la durÃ©e dans le trainingActionInfo/duration",
      required: false,
      defaultValue: 0,
    }),
    code: Property.Dropdown({
      displayName: 'Raison de la sortie de formation',
      description: 'SÃ©lectionner la raison de sortie de formation',
      required: true,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }
        const response = (
          await httpClient.sendRequest({
            method: HttpMethod.GET,
            url:
              wedofCommon.baseUrl +
              '/registrationFoldersReasons?type=terminated',
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': auth as string,
            },
          })
        ).body;
        const reasons = response.map(
          (reason: { label: string; code: string }) => {
            return { label: reason.label, value: reason.code };
          }
        );
        return {
          disabled: false,
          options: reasons,
        };
      },
    }),
    date: Property.DateTime({
      displayName: 'Sortie de formation le',
      description: "Date du sortie de formation au format YYYY-MM-DD. Par dÃ©faut, date du jour. Si la date a dÃ©jÃ  Ã©tÃ© indiquÃ©e au moment du terminate, il n'est pas nÃ©cessaire de la reprÃ©ciser",
      required: false,
      defaultValue: dayjs(new Date()).format('YYYY-MM-DD'),
    }),
  },

  async run(context) {
    const message = {
      absenceDuration: context.propsValue.absenceDuration ?? null,
      forceMajeureAbsence: context.propsValue.forceMajeureAbsence ?? null,
      trainingDuration: context.propsValue.trainingDuration ?? null,
      code: context.propsValue.code ?? null,
      date: context.propsValue.date ? dayjs(context.propsValue.date).format('YYYY-MM-DD') : null,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId +
          '/serviceDone',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
