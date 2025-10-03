﻿import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@IOpeer/pieces-common';
import {
  createPiece,
  PieceAuth,
  Property,
} from '@IOpeer/pieces-framework';
import { onEventChanged } from './lib/triggers/calendar-event';
import { onChangedData } from './lib/triggers/on-changed-data';
import { PieceCategory } from '@IOpeer/shared';
import { eventsById } from './lib/actions/get-events-by-id';

export const weblingAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      defaultValue: 'example.webling.ch',
    }),
    apikey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://${auth.baseUrl}/api/1/member`,
        headers: {
          apikey: auth.apikey,
        },
      };
      await httpClient.sendRequest(request);
      return {
        valid: true,
      };
    } catch (e: any) {
      return {
        valid: false,
        error: e?.message,
      };
    }
  },
});

export const webling = createPiece({
  displayName: 'Webling',
  auth: weblingAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.IOpeer.com/pieces/webling.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['felifluid'],
  actions: [eventsById],
  triggers: [onEventChanged, onChangedData],
});
