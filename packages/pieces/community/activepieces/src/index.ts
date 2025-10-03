import {
  createPiece,
  PieceAuth,
  Property,
} from '@IOpeer/pieces-framework';
import { createProject } from './lib/actions/create-project';
import { listProject } from './lib/actions/list-project';
import { updateProject } from './lib/actions/update-project';
import { createCustomApiCallAction } from '@IOpeer/pieces-common';

const markdown = `
IOPeer Platform API is available under the Platform Edition.
(https://www.IOpeer.com/docs/admin-console/overview)

**Note**: The API Key is available in the Platform Dashboard.

`;

export const activePieceAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    baseApiUrl: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      defaultValue: 'https://cloud.IOpeer.com/api/v1',
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
});

export const IOpeer = createPiece({
  displayName: 'IOPeer Platform',
  description: 'Open source no-code business automation',
  auth: activePieceAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.IOpeer.com/pieces/IOpeer.png',
  authors: ['doskyft', 'abuaboud', 'AdamSelene'],
  actions: [
    createProject,
    updateProject,
    listProject,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return `${(auth as { baseApiUrl: string }).baseApiUrl}`;
      },
      auth: activePieceAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { apiKey: string }).apiKey}`,
      }),
    }),
  ],
  triggers: [],
});
