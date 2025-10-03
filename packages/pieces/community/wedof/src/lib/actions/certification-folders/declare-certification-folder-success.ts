import { createAction, Property } from '@IOpeer/pieces-framework';
import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const declareCertificationFolderSuccess = createAction({
  auth: wedofAuth,
  name: 'declareCertificationFolderSuccess',
  displayName: "Passer un dossier de certification Ã  l'Ã©tat : RÃ©ussi",
  description: "Change l'Ã©tat d'un dossier de certification vers : RÃ©ussi",
  props: {
    externalId: Property.ShortText({
      displayName: 'NÂ° du dossier de certification',
      description:
        'SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de certification',
      required: true,
    }),
    detailedResult: Property.ShortText({
      displayName: "DÃ©tail du rÃ©sultat de l'examen",
      required: false,
    }),
    europeanLanguageLevel: wedofCommon.europeanLanguageLevel,
    issueDate: Property.DateTime({
      displayName: "Date d'obtention de la certification",
      description: 'Date au format YYYY-MM-DD.',
      required: true,
    }),
    digitalProofLink: Property.ShortText({
      displayName:
        "Lien vers la preuve numÃ©rique de l'obtention de la certification",
      required: false,
    }),
    gradePass: wedofCommon.gradePass,
    comment: Property.LongText({
      displayName: 'Commentaire',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      detailedResult: context.propsValue.detailedResult,
      issueDate: context.propsValue.issueDate
        ? dayjs(context.propsValue.issueDate).format('YYYY-MM-DD')
        : null,
      digitalProofLink: context.propsValue.digitalProofLink,
      europeanLanguageLevel: context.propsValue.europeanLanguageLevel,
      gradePass: context.propsValue.gradePass,
      comment: context.propsValue.comment,
    };
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.externalId +
          '/success',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
