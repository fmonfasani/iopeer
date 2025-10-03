import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const billRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'billRegistrationFolder',
  displayName: 'Facturer le dossier de formation',
  description:
    'Associe le dossier de formation Ã  un nÂ° de facture et transmets les informations de facturation au financeur (EDOF par exemple)',
  props: {
    externalId: Property.ShortText({
      displayName: 'NÂ° du dossier de formation',
      description:
        'SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de formation',
      required: true,
    }),
    billNumber: Property.ShortText({
      displayName: 'NÂ° de facture',
      description: 'NÂ° de la facture Ã  associer',
      required: true,
    }),
    vatRate: Property.Number({
      displayName: 'TVA',
      description:
        'Permet de forcer un Taux de TVA en %. Par dÃ©faut la TVA est calculÃ©e Ã  partir des donnÃ©es du dossier de formation',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      billNumber: context.propsValue.billNumber,
      vatRate: context.propsValue.vatRate,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId +
          '/billing',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
