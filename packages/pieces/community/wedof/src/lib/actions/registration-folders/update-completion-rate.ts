import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const updateCompletionRate = createAction({
  auth: wedofAuth,
  name: 'updateCompletionRate',
  displayName: "Mettre Ã  jour l'assiduitÃ© d'un apprenant",
  description:
    "Mettre Ã  jour le taux d'avancement en % d'assiduitÃ© d'un apprenant pour un Dossier de formation donnÃ©.",
  props: {
    externalId: Property.ShortText({
      displayName: 'NÂ° du dossier de formation',
      description:
        'SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de formation',
      required: true,
    }),
    completionRate: Property.Number({
      displayName: "Taux d'avancement",
      description: "Taux d'avancement en % compris entre 0% et 100%. Uniquement sous format d'un entier. Uniquement possible Ã  l'Ã©tat En formation et Sortie de formation",
      required: true,
    }),
  },
  async run(context) {
    const message = {
        completionRate: context.propsValue.completionRate,
    };
    return (
      await httpClient.sendRequest({
        method: HttpMethod.PUT,
        body: message,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
