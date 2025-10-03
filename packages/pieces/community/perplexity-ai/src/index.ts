﻿import { createPiece, PieceAuth } from '@IOpeer/pieces-framework';
import { PieceCategory } from '@IOpeer/shared';
import { createChatCompletionAction } from './lib/actions/create-chat-completion.action';

export const perplexityAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
  Navigate to [API Settings](https://www.perplexity.ai/settings/api) and create new API key.
  `,
});

export const perplexityAi = createPiece({
  displayName: 'Perplexity AI',
  auth: perplexityAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.IOpeer.com/pieces/perplexity-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: 'AI powered search engine',
  authors: ['kishanprmr','AbdulTheActivePiecer'],
  actions: [createChatCompletionAction],
  triggers: [],
});
