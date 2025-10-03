import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const getCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'getCertificationFolder',
  displayName: 'RÃ©cupÃ©rer un dossier de certification',
  description:
    'RÃ©cupÃ©rer un dossier de certification Ã  partir de son nÂ° de dossier',
  props: {
    externalId: Property.ShortText({
      displayName: 'NÂ° du dossier de certification',
      description:
        'SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de certification',
      required: true,
    }),
  },
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.externalId,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
