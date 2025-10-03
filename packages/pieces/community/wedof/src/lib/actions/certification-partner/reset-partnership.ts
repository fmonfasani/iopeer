import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const resetPartnership = createAction({
  auth: wedofAuth,
  name: 'resetPartnership',
  displayName: "RÃ©initialiser un partenariat",
  description: "Permet de rÃ©initialiser les donnÃ©es du partenariat en Ã©tat 'Demande en traitement'",

  props: {
    certifInfo: Property.ShortText({
      displayName: 'NÂ° certifInfo',
      description: 'Identifiant de la certification',
      required: true,
    }),
    siret: Property.ShortText({
      displayName: 'NÂ° siret',
      description: 'NumÃ©ro SIRET du partenaire Ã  rÃ©initialiser',
      required: true,
    }),
  },
  
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: wedofCommon.baseUrl + '/certifications/'+ context.propsValue.certifInfo +'/partners/'+ context.propsValue.siret +'/reinitialize',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
