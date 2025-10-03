﻿import { createPiece, PieceAuth } from '@IOpeer/pieces-framework';
import { PieceCategory } from '@IOpeer/shared';
import { simplePDFNewSubmission } from './lib/triggers/new-submission';

export const simplepdf = createPiece({
  displayName: 'SimplePDF',
  description: 'PDF editing and generation tool',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.IOpeer.com/pieces/simplepdf.png',
  authors: ["bendersej","kishanprmr","khaledmashaly","abuaboud"],
  categories: [PieceCategory.CONTENT_AND_FILES],
  actions: [],
  triggers: [simplePDFNewSubmission],
});
