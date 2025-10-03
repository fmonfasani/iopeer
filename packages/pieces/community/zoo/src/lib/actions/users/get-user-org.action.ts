﻿import { createAction } from '@IOpeer/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@IOpeer/pieces-common';

export const getUserOrgAction = createAction({
  name: 'get_user_org',
  displayName: 'Get User Organization',
  description: 'Get the organization associated with your user account',
  auth: zooAuth,
  // category: 'Users',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/user/org',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
