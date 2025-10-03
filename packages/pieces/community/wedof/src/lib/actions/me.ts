import {wedofAuth} from '../../index';
import {createAction} from '@IOpeer/pieces-framework';
import {HttpMethod, httpClient} from '@IOpeer/pieces-common';
import {wedofCommon} from '../common/wedof';

export const me = createAction({
    auth: wedofAuth,
    name: 'me',
    displayName: "RÃ©cupÃ©rer mes informations",
    description: "RÃ©cupÃ©rer mes informations et mes dÃ©tails",
    props: {},
    async run(context) {
        return (
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url:
                    wedofCommon.baseUrl + '/users/me',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': context.auth as string,
                },
            })
        ).body;
    },
});
