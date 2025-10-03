﻿import { createPiece } from '@IOpeer/pieces-framework';
import { PieceCategory } from '@IOpeer/shared';
import { grokAuth } from './lib/common/auth';
import { askGrok } from './lib/actions/ask-grok';
import { extractDataFromText } from './lib/actions/extract-data';
import { categorizeText } from './lib/actions/categorize-text';
import { generateImage } from './lib/actions/generate-image';
import { createCustomApiCallAction } from '@IOpeer/pieces-common';
import { XAI_BASE_URL } from './lib/common/constants';

export const grokXai = createPiece({
  displayName: 'Grok by xAI',
  description: 'AI chatbot by xAI that answers questions, generates text, extracts data, and provides real-time insights.',
  auth: grokAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.IOpeer.com/pieces/grok-xai.png',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['sparkybug'],
  actions: [
    askGrok,
    extractDataFromText,
    categorizeText,
    generateImage,
    createCustomApiCallAction({
      auth: grokAuth,
      baseUrl: () => XAI_BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
