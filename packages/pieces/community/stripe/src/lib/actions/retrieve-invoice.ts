import { createAction } from '@IOpeer/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@IOpeer/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeRetrieveInvoice = createAction({
  name: 'retrieve_invoice',
  auth: stripeAuth,
  displayName: 'Retrieve an Invoice',
  description: 'Retrieves the details of an existing invoice by its ID.',
  props: {
    invoice_id: stripeCommon.invoice, 
  },
  async run(context) {
    const { invoice_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/invoices/${invoice_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
    });

    return response.body;
  },
});
