﻿import { PieceAuth, createPiece } from '@IOpeer/pieces-framework';
import { PieceCategory } from '@IOpeer/shared';
import { gravityFormsNewSubmission } from './lib/triggers/new-submission';

export const gravityforms = createPiece({
  displayName: 'Gravity Forms',
  description: 'Build and publish your WordPress forms',

  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.27.1',
  logoUrl: 'https://cdn.IOpeer.com/pieces/gravityforms.svg',
  authors: ["Abdallah-Alwarawreh","kishanprmr","MoShizzle","abuaboud"],
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  actions: [],
  triggers: [gravityFormsNewSubmission],
});
