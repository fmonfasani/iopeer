﻿import { httpClient, HttpMethod, AuthenticationType } from '@IOpeer/pieces-common';
import { OAuth2PropertyValue } from '@IOpeer/pieces-framework';

const TEAMLEADER_API_BASE_URL = 'https://api.focus.teamleader.eu';

export const teamleaderCommon = {
    baseUrl: TEAMLEADER_API_BASE_URL,
    
    async apiCall({
        auth,
        method,
        resourceUri,
        body = undefined,
        queryParams = undefined,
    }: {
        auth: OAuth2PropertyValue;
        method: HttpMethod;
        resourceUri: string;
        body?: any;
        queryParams?: Record<string, string>;
    }) {
        return await httpClient.sendRequest({
            method: method,
            url: `${TEAMLEADER_API_BASE_URL}${resourceUri}`,
            body,
            queryParams,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: auth.access_token,
            }
        });
    }
};
