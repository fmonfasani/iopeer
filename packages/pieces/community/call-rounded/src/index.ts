import { createPiece, PieceAuth } from "@IOpeer/pieces-framework";
import { createCustomApiCallAction } from '@IOpeer/pieces-common';

export const callRoundedAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please enter the API Key obtained from Call Rounded.',
});

export const callRounded = createPiece({
  displayName: "Call-rounded",
  auth: callRoundedAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.IOpeer.com/pieces/call-rounded.png",
  authors: ["perrine-pullicino-alan"],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => {
        return "https://api.callrounded.com/v1";
      },
      auth: callRoundedAuth,
      authMapping: async (auth) => ({
        'x-app': 'IOpeer',
        'x-api-key': auth as string,
      }),
    })
  ],
    triggers: [],
});
