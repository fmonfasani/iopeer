import { createPiece, PieceAuth } from "@IOpeer/pieces-framework";
import { PieceCategory } from "@IOpeer/shared";
import { createRecordAction } from "./lib/actions/create-record.action";
import { updateRecordAction } from "./lib/actions/update-record.action";
import { deleteRecordAction } from "./lib/actions/delete-record.action";
import { findRecordAction } from "./lib/actions/find-record.action";
import { recordCreatedOrUpdatedTrigger } from "./lib/triggers/record-created-updated.trigger";

export const fireberryAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Fireberry API Key. You can generate it from your Fireberry account settings.',
  required: true,
});

export const fireberry = createPiece({
  displayName: "Fireberry",
  auth: fireberryAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.IOpeer.com/pieces/fireberry.png",
  authors: ["sparkybug", "onyedikachi-david"],
  categories: [PieceCategory.SALES_AND_CRM],
  actions: [
    createRecordAction,
    updateRecordAction,
    deleteRecordAction,
    findRecordAction,
  ],
  triggers: [
    recordCreatedOrUpdatedTrigger,
  ],
});
    
