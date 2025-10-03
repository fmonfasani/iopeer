import {
  createPiece,
  OAuth2PropertyValue,
} from '@IOpeer/pieces-framework';
import { PieceCategory } from '@IOpeer/shared';
import { youtubeNewVideoTrigger } from './lib/triggers/new-video.trigger';
import { youtubeAuth } from './lib/common/auth';
import { createCustomApiCallAction } from '@IOpeer/pieces-common';

export const youtube = createPiece({
  displayName: 'YouTube',
  description:
    'Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube',

  minimumSupportedRelease: '0.33.0',
  logoUrl: 'https://cdn.IOpeer.com/pieces/youtube.png',
  categories: [PieceCategory.CONTENT_AND_FILES],
  auth: youtubeAuth,
  authors: ['abaza738', 'kishanprmr', 'khaledmashaly', 'abuaboud'],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => 'https://www.googleapis.com/youtube/v3',
      auth: youtubeAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [youtubeNewVideoTrigger],
});
