﻿import { PieceAuth } from "@IOpeer/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@IOpeer/pieces-common";

export const SiteSpeakAuth = PieceAuth.SecretText({
    displayName: 'SiteSpeakAI API Key',
    description: `**Enter your SiteSpeakAI API Key.**
---
### How to obtain your API key
1. Sign up / log in at [SiteSpeakAI](https://sitespeak.ai/).
2. Go to **Dashboard â†’ Settings â†’ API Keys**.
3. Generate or copy an API key.
4. Paste it here.
`,
    required: true,
    validate: async ({ auth }) => {
        if (!auth) {
            return {
                valid: false,
                error: 'API Key is required',
            };
        }

        try {
            await makeRequest(auth as string, HttpMethod.GET, `/me`);
            return {
                valid: true,
            };
        } catch (error) {
            return {
                valid: false,
                error: 'Invalid SiteSpeakAI API Key',
            };
        }
    },
});
