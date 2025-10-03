﻿import { PieceAuth } from '@IOpeer/pieces-framework';
import { HttpMethod } from '@IOpeer/pieces-common';
import { browseAiApiCall } from './client';

export const browseAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'You can find your Browse AI API key on the dashboard under Settings â†’ API Key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await browseAiApiCall({
        method: HttpMethod.GET,
        resourceUri: '/status',
        auth: { apiKey: auth },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key. Please check your Browse AI credentials.',
      };
    }
  },
});
