import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const getMinimalSessionDates = createAction({
  auth: wedofAuth,
  name: 'getMinimalSessionsDates',
  displayName: 'Date minimale de dÃ©but de session de formation',
  description:
    'RÃ©cupÃ©ration des dates minimales de dÃ©but de session de formation',
  props: {},

  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: wedofCommon.baseUrl + '/registrationFolders/utils/sessionMinDates',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
