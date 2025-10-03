import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
  import { wedofAuth } from '../../..';
  import {
    createAction,
    Property,
  } from '@IOpeer/pieces-framework';
  import { wedofCommon } from '../../common/wedof';
  
  export const getCertificationFolderSurvey = createAction({
    auth: wedofAuth,
    name: 'getCertificationFolderSurvey',
    displayName: "RÃ©cupÃ©ration d'une enquÃªte",
    description: "Permet de rÃ©cupÃ©rer une enquÃªte associÃ©e Ã  un dossier de certification",
    props: {
      certificationFolderExternalId: Property.ShortText({
        displayName: 'NÂ° de dossier de certification',
        description: "SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de certification",
        required: true,
      }),
    },
  
    async run(context) {
      return (
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: wedofCommon.baseUrl + '/surveys/'+ context.propsValue.certificationFolderExternalId,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
    },
  });
