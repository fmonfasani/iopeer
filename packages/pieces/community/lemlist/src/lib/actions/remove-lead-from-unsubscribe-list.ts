import { createAction, Property } from '@IOpeer/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { lemlistApiService } from '../common/requests';

export const removeLeadFromUnsubscribeList = createAction({
  auth: lemlistAuth,
  name: 'removeLeadFromUnsubscribeList',
  displayName: 'Remove Lead From Unsubscribe List',
  description: 'Remove a lead from â€œunsubscribeâ€ list.',
  props: {
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to remove from the unsubscribe list.',
      required: true,
    }),
  },
  async run({ auth, propsValue: { email } }) {
    return await lemlistApiService.removeLeadFromUnsubscribeList(auth, {
      leadEmail: email as string,
    });
  },
});
