import { createAction, Property } from '@IOpeer/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { lemlistApiService } from '../common/requests';

export const markLeadFromAllCampaignsAsNotInterested = createAction({
  auth: lemlistAuth,
  name: 'markLeadFromAllCampaignsAsNotInterested',
  displayName: 'Mark Lead From All Campaigns as Not Interested',
  description: 'Mark a lead as â€œnot interestedâ€ across all campaigns.',
  props: {
    email: Property.ShortText({
      displayName: 'Lead Email',
      description: 'The email of the lead to mark as not interested.',
      required: true,
    }),
  },
  async run({ auth, propsValue: { email } }) {
    return await lemlistApiService.markLeadAsNotInterestedInAllCampaigns(auth, {
      leadEmail: email as string,
    });
  },
});
