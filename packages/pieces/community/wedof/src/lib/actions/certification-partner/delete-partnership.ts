import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const deletePartnership = createAction({
  auth: wedofAuth,
  name: 'deletePartnership',
  displayName: "Supprimer un partenariat",
  description: "Supprime un partenariat Ã  l'Ã©tat Demande Ã  complÃ©ter",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'NÂ° certifInfo',
      description: 'SÃ©lectionner le {certifInfo} de la certification considÃ©rÃ©e',
      required: true,
    }),
    siret: Property.ShortText({
      displayName: 'NÂ° Siret',
      description: 'SÃ©lectionner le {siret} du partenaire',
      required: true,
    }),
  },
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url:
          wedofCommon.baseUrl +
          '/certifications/' +
          context.propsValue.certifInfo +
          '/partners/' +
          context.propsValue.siret,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
