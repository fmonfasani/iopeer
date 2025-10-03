﻿import { createAction } from '@IOpeer/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@IOpeer/pieces-common';

export const deleteUserAction = createAction({
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Delete your user account',
  auth: zooAuth,
  // category: 'Users',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: 'https://api.zoo.dev/user',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
