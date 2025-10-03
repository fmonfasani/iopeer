﻿import { PieceAuth, createPiece } from "@IOpeer/pieces-framework";
import { createCustomApiCallAction, httpClient, HttpMethod } from "@IOpeer/pieces-common";
import { createTextToSound } from "./lib/actions/create-text-to-sound";
import { createTextToSpeech } from "./lib/actions/create-text-to-speech";
import { createTranslation } from "./lib/actions/create-translation";
import { createTranscription } from "./lib/actions/create-transcription";
import { API_BASE_URL } from "./lib/common";
import { PieceCategory } from "@IOpeer/shared";

export const cambaiAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: `
    To get your API key, please follow these steps:
    1. Log in to your [CAMB.AI Studio](https://camb.ai/studio/) account.
    2. Navigate to your workspace's API Keys dashboard.
    3. Create a new key if you haven't already.
    4. Copy the API key and paste it here.
    `,
    required: true,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${API_BASE_URL}/source-languages`,
                headers: {
                    'x-api-key': auth,
                }
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API Key.',
            };
        }
    }
});

export const cambAi = createPiece({
    displayName: "Camb.AI",
    auth: cambaiAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.IOpeer.com/pieces/camb-ai.png",
    authors: ['david-oluwaseun420','sanket-a11y'], 
    categories:[PieceCategory.ARTIFICIAL_INTELLIGENCE],
    actions: [
        createTextToSound,
        createTextToSpeech,
        createTranslation,
        createTranscription,
        createCustomApiCallAction({
            auth: cambaiAuth,
            baseUrl: () => API_BASE_URL,
            authMapping: async (auth) => {
                return {
                    'x-api-key': auth as string,
                };
            },
        }),
    ],
    triggers: [],
});
