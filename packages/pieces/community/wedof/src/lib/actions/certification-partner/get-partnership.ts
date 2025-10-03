import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const getPartnership = createAction({
  auth: wedofAuth,
  name: 'getPartnership',
  displayName: "RÃ©cupÃ©ration d'un partenariat",
  description:
    "RÃ©cupÃ©ration d'un partenariat par le certifInfo de la certification et du siret du partenaire",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'NÂ° certifInfo',
      description:
        'SÃ©lectionner le {certifInfo} de la certification considÃ©rÃ©e',
      required: true,
    }),
    siret: Property.ShortText({
        displayName: 'NÂ° Siret',
        description:
          'SÃ©lectionner le {siret} du partenaire',
        required: true,
      }),
  },
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
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
