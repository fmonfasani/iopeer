import { httpClient, HttpMethod } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const validateRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'validateRegistrationFolder',
  displayName: 'Valider le dossier de formation',
  description: "Passer l'Ã©tat du dossier de formation Ã  l'Ã©tat validÃ©",
  props: {
    externalId: Property.ShortText({
      displayName: 'NÂ° du dossier de formation',
      description:
        'SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de formation',
      required: true,
    }),
    indicativeDuration: Property.Number({
      displayName: 'DurÃ©e totale de la formation',
      description:
        "Obligatoire dans le cas d'un dossier de formation avec financement France Travail",
      required: false,
    }),
    weeklyDuration: Property.Number({
      displayName: 'IntensitÃ© hebdomadaire',
      description:
        'IntensitÃ© hebdomadaire de la formation, en heures par semaine',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      indicativeDuration: context.propsValue.indicativeDuration,
      weeklyDuration: context.propsValue.weeklyDuration,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId +
          '/validate',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
