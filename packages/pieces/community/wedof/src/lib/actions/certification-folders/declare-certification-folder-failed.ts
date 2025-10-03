import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const declareCertificationFolderFailed = createAction({
  auth: wedofAuth,
  name: 'declareCertificationFolderFailed',
  displayName: 'Passer un dossier de certification Ã  lâ€™Ã©tat : Ã‰chouÃ©',
  description: "Change l'Ã©tat d'un dossier de certification vers : Ã‰chouÃ©",
  props: {
    externalId: Property.ShortText({
      displayName: 'NÂ° du dossier de certification',
      description:
        'SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de certification',
      required: true,
    }),
    detailedResult: Property.ShortText({
      displayName: "DÃ©tail du rÃ©sultat de l'examen",
      required: false,
    }),
    europeanLanguageLevel: wedofCommon.europeanLanguageLevel,
    comment: Property.LongText({
      displayName: 'Commentaire',
      required: false,
    }),
  },

  async run(context) {
    const message = {
      detailedResult: context.propsValue.detailedResult,
      europeanLanguageLevel: context.propsValue.europeanLanguageLevel,
      comment: context.propsValue.comment,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.externalId +
          '/fail',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
