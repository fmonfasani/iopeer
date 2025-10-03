﻿import { createCustomApiCallAction } from '@IOpeer/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@IOpeer/pieces-framework';
import { PieceCategory } from '@IOpeer/shared';
import { createIssueAction } from './lib/actions/create-issue-action';
import { issuesEventTrigger } from './lib/trigger/issue-event';

export const gitlabAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://gitlab.com/oauth/authorize',
  tokenUrl: 'https://gitlab.com/oauth/token',
  scope: ['api', 'read_user'],
});

export const gitlab = createPiece({
  displayName: 'GitLab',
  description: 'Collaboration tool for developers',

  auth: gitlabAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.IOpeer.com/pieces/gitlab.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  actions: [
    createIssueAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://gitlab.com/api/v4',
      auth: gitlabAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [issuesEventTrigger],
});
