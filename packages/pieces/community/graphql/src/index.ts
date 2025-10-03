
import { createPiece, PieceAuth } from "@IOpeer/pieces-framework";
import { query } from "./lib/actions/query";
import { PieceCategory } from "@IOpeer/shared";
    
    export const graphql = createPiece({
      displayName: "GraphQL",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.30.0',
      logoUrl: "https://cdn.IOpeer.com/pieces/graphql.svg",
      categories:[PieceCategory.CORE],
      authors: ['mahmuthamet'],
      actions: [query],
      triggers: [],
    });
    
