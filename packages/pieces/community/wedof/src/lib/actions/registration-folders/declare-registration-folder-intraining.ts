import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const declareRegistrationFolderIntraining = createAction({
  auth: wedofAuth,
  name: 'declareRegistrationFolderIntraining',
  displayName: "Passer un dossier de formation Ã  l'Ã©tat : En formation",
  description: "Change l'Ã©tat d'un dossier de formation vers : En formation",

  props: {
    externalId: Property.ShortText({
      displayName: 'NÂ° du dossier de formation',
      description:
        'SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de formation',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'EntrÃ©e en formation le',
      description: 'Date au format YYYY-MM-DD.',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      date: context.propsValue.date
        ? dayjs(context.propsValue.date).format('YYYY-MM-DD')
        : null,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId +
          '/inTraining',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
