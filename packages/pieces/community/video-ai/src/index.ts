
import { createPiece, PieceAuth } from "@IOpeer/pieces-framework";
import { generateVideo } from "./lib/actions/generate-video";
import { PieceCategory } from "@IOpeer/shared";

export const videoAI = createPiece({
  displayName: "Video AI",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.68.2',
  logoUrl: "https://cdn.IOpeer.com/pieces/video-ai-piece.svg",
  authors: ['amrdb'],
  actions: [generateVideo],
  triggers: [],
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
});
