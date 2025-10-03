import { createAction } from '@IOpeer/pieces-framework';
import { HttpMethod } from '@IOpeer/pieces-common';
import { pandadocClient, pandadocAuth } from '../common';
import { documentDropdown } from '../common/dynamic-dropdowns';

export const getDocumentDetails = createAction({
  name: 'getDocumentDetails',
  displayName: 'Get Document',
  description: 'Retrieves comprehensive document data.',
  auth: pandadocAuth,
  props: {
    document_id: documentDropdown,
  },
  async run({ auth, propsValue }) {
    return await pandadocClient.makeRequest(
      auth as string,
      HttpMethod.GET,
      `/documents/${propsValue.document_id}/details`
    );
  },
});
