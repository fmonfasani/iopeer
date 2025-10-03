import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const createPartnership = createAction({
  auth: wedofAuth,
  name: 'createPartnership',
  displayName: "CrÃ©er un partenariat",
  description: "Permet de crÃ©er un nouveau partenariat avec le SIRET fourni",
  
  props: {
    certifInfo: Property.ShortText({
          displayName: 'NÂ° certifInfo',
          description:
            'SÃ©lectionner le {certifInfo} de la certification considÃ©rÃ©e', 
        required: true, 
        }),
    siret: Property.ShortText({
      displayName: 'NÂ° siret',
      description: 'Le numÃ©ro SIRET du partenaire',
      required: true,
    }),
  },
  
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: wedofCommon.baseUrl + '/certifications/partners/' + context.propsValue.siret,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
        body:{
          'certifInfo': context.propsValue.certifInfo,
        }

      })
    ).body;
  },
});
