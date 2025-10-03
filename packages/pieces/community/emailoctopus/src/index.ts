﻿import { createPiece } from "@IOpeer/pieces-framework";
import { emailOctopusAuth } from "./lib/common/auth";


import { addOrUpdateContact } from "./lib/actions/add-or-update-contact";
import { unsubscribeContact } from "./lib/actions/unsubscribe-contact";
import { updateContactEmail } from "./lib/actions/update-contact-email";
import { addTagToContact } from "./lib/actions/add-tag-to-contact";
import { removeTagFromContact } from "./lib/actions/remove-tag-from-contact";
import { createList } from "./lib/actions/create-list";
import { findContact } from "./lib/actions/find-contact"; 
import { PieceCategory } from '@IOpeer/shared';


import { emailBounced } from "./lib/triggers/email-bounced";
import { emailOpened } from "./lib/triggers/email-opened"; 
import { emailClicked } from "./lib/triggers/email-Clicked";
import { newContact } from "./lib/triggers/new-Contact";
import { contactUnsubscribes } from "./lib/triggers/contact-Unsubscribes";
import { createCustomApiCallAction } from "@IOpeer/pieces-common";
import { emailOctopusApiUrl } from "./lib/common/client";

export const emailoctopus = createPiece({
    displayName: "EmailOctopus",
    description: 'Email marketing platform for list management, campaign sending, tagging & unsubscribes. Automate contact management and campaign engagement tracking.',
    auth: emailOctopusAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.IOpeer.com/pieces/emailoctopus.png",
    categories: [PieceCategory.MARKETING],
    authors: ['Pranith124'],
    actions: [
        addOrUpdateContact,
        unsubscribeContact,
        updateContactEmail,
        addTagToContact,
        removeTagFromContact,
        createList,
        findContact ,
        createCustomApiCallAction({
          auth:emailOctopusAuth,
          baseUrl:()=>emailOctopusApiUrl,
          authMapping:async (auth)=>{
            return{
              Authorization:`Bearer ${auth}`
            }
          }
          
        })
    ],
    triggers: [
      emailBounced,
      emailOpened,
      emailClicked,
      newContact,
      contactUnsubscribes
    ],
});
