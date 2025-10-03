﻿import { createAction } from '@IOpeer/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@IOpeer/pieces-common';

export const getOrgAction = createAction({
  name: 'get_org',
  displayName: 'Get Organization',
  description: 'Retrieve details of your organization',
  auth: zooAuth,
  // category: 'Organizations',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/org',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });
    return response.body;
  },
});
