import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const abortCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'abortCertificationFolder',
  displayName: 'Passer un dossier de certification Ã  lâ€™Ã©tat : AbandonnÃ©',
  description: "Change l'Ã©tat d'un dossier de certification vers : AbandonnÃ©",
  props: {
    externalId: Property.ShortText({
      displayName: 'NÂ° du dossier de certification',
      description:
        'SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de certification',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Commentaire',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      comment: context.propsValue.comment,
    };
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.externalId +
          '/abort',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
