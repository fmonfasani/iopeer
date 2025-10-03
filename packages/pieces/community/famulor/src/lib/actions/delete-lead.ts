import { createAction } from '@IOpeer/pieces-framework';
import { propsValidation } from '@IOpeer/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const deleteLead = createAction({
  auth: famulorAuth,
  name: 'deleteLead',
  displayName: 'Delete Lead',
  description: 'âš ï¸ Permanently delete a lead from the system. This action cannot be undone and will abort any ongoing calls.',
  props: famulorCommon.deleteLeadProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.deleteLeadSchema);

    return await famulorCommon.deleteLead({
      auth: auth as string,
      lead_id: propsValue.lead_id as number,
    });
  },
});
