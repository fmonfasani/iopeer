import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const declareCertificationFolderToRetake = createAction({
  auth: wedofAuth,
  name: 'declareCertificationFolderToRetake',
  displayName: 'Passer un dossier de certification Ã  lâ€™Ã©tat : Ã  repasser',
  description: "Change l'Ã©tat d'un dossier de certification vers : Ã  repasser",
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
    examinationDate: Property.DateTime({
      displayName: "Date de passage de l'examen",
      description: 'Date au format YYYY-MM-DD.',
      required: false,
    }),
    examinationEndDate: Property.DateTime({
      displayName: "Date de fin de passage de l'examen",
      description: 'Date au format YYYY-MM-DD.',
      required: false,
    }),
    examinationPlace: Property.ShortText({
      displayName: "Lieu de passage de l'examen",
      required: false,
    }),
    examinationType: wedofCommon.examinationType,
    comment: Property.LongText({
      displayName: 'Commentaire',
      required: false,
    }),
  },

  async run(context) {
     const message = {
      detailedResult: context.propsValue.detailedResult,
      europeanLanguageLevel: context.propsValue.europeanLanguageLevel,
      examinationDate: context.propsValue.examinationDate
        ? dayjs(context.propsValue.examinationDate).format('YYYY-MM-DD')
        : null,
      examinationEndDate: context.propsValue.examinationEndDate
        ? dayjs(context.propsValue.examinationEndDate).format('YYYY-MM-DD')
        : null,
      examinationPlace: context.propsValue.examinationPlace,
      examinationType: context.propsValue.examinationType,
      comment: context.propsValue.comment,
    };

    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.externalId +
          '/retake',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
