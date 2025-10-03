import { wedofAuth } from '../../index';
import { Property, createAction } from '@IOpeer/pieces-framework';

export const addExecutionTag = createAction({
  auth: wedofAuth,
  name: 'addExecutionTag',
  displayName: 'Associer le run Ã  wedof',
  description:
    "Permet d'associer une exÃ©cution de workflow Ã  un ou plusieurs dossiers de (formations / certifications) dans wedof",
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    externalId: Property.Array({
      displayName: 'NumÃ©ros de dossier',
      description:
        'Entrez un ou plusieurs numÃ©ros de dossier Ã  associer Ã  cette exÃ©cution.',
      required: true,
      defaultValue: [],
    }),
  },
  async run(context) {
    for (const id of context.propsValue.externalId as string[]) {
      await context.tags.add({ name: id });
    }
    return {
      success: true,
      tagsAjoutes: context.propsValue.externalId,
    };
  },
});
