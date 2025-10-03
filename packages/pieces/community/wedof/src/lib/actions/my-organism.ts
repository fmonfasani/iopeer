import {wedofAuth} from '../../index';
import {createAction} from '@IOpeer/pieces-framework';
import {HttpMethod, httpClient} from '@IOpeer/pieces-common';
import {wedofCommon} from '../common/wedof';

export const myOrganism = createAction({
    auth: wedofAuth,
    name: 'myOrganism',
    displayName: "RÃ©cupÃ©rer mon organisme",
    description: "RÃ©cupÃ©rer mon organisme et afficher ses dÃ©tails",
    props: {},
    async run(context) {
        return (
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url:
                    wedofCommon.baseUrl + '/organisms/me',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': context.auth as string,
                },
            })
        ).body;
    },
});
