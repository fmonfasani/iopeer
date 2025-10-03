﻿import { PieceAuth, createPiece } from '@IOpeer/pieces-framework';
import { fetchTopStories } from './lib/actions/top-stories-in-hacker-news';

export const hackernews = createPiece({
  displayName: 'Hacker News',
  description: 'A social news website',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.IOpeer.com/pieces/hackernews.png',
  auth: PieceAuth.None(),
  categories: [],
  authors: ["kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  actions: [fetchTopStories],
  triggers: [],
});
