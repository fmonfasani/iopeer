﻿import { createPiece } from "@IOpeer/pieces-framework";
import { PieceCategory } from "@IOpeer/shared";
import { createChatCompletion } from "./lib/actions/create-chat-completion";
import { createEmbeddings } from "./lib/actions/create-embeddings";
import { uploadFile } from "./lib/actions/upload-file";
import { listModels } from "./lib/actions/list-models";
import { mistralAuth } from "./lib/common/auth";
import { createCustomApiCallAction } from "@IOpeer/pieces-common";

export const mistralAi = createPiece({
  displayName: "Mistral AI",
  description: "Mistral AI provides state-of-the-art open-weight and hosted language models for text generation, embeddings, and reasoning tasks.",
  auth: mistralAuth,
  minimumSupportedRelease: "0.36.1",
  logoUrl: "https://cdn.IOpeer.com/pieces/mistral-ai.png",
  authors: ["sparkybug"],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    createChatCompletion,
    createEmbeddings,
    uploadFile,
    listModels,
    createCustomApiCallAction({
      auth:mistralAuth,
      baseUrl:()=>'https://api.mistral.ai/v1',
      authMapping:async (auth)=>{
        return{
          Authorization:`Bearer ${auth as string}`
        }
      }
    })
  ],
  triggers: [],
});
    
