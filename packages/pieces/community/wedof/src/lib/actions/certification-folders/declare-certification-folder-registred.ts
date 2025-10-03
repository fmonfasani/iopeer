import { createAction, Property } from '@IOpeer/pieces-framework';
import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const declareCertificationFolderRegistred = createAction({
  auth: wedofAuth,
  name: 'declareCertificationFolderRegistred',
  displayName: "Passer un dossier de certification Ã  l'Ã©tat : EnregistrÃ©",
  description: "Change l'Ã©tat d'un dossier de certification vers : EnregistrÃ©",
  props: {
    externalId: Property.ShortText({
      displayName: 'NÂ° du dossier de certification',
      description:
        'SÃ©lectionner la propriÃ©tÃ© {externalId} du dossier de certification',
      required: true,
    }),
    enrollmentDate: Property.DateTime({
      displayName: "Date d'inscription Ã  la certification",
      description: 'Date au format YYYY-MM-DD.',
      required: false,
    }),
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
    examinationType: wedofCommon.examinationType,
    examinationPlace: Property.ShortText({
      displayName: "Lieu de passage de l'examen",
      required: false,
    }),
    comment: Property.LongText({
      displayName: 'Commentaire',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      enrollmentDate: context.propsValue.enrollmentDate
        ? dayjs(context.propsValue.enrollmentDate).format('YYYY-MM-DD')
        : null,
      examinationDate: context.propsValue.examinationDate
        ? dayjs(context.propsValue.examinationDate).format('YYYY-MM-DD')
        : null,
      examinationEndDate: context.propsValue.examinationEndDate
        ? dayjs(context.propsValue.examinationEndDate).format('YYYY-MM-DD')
        : null,
      examinationType: context.propsValue.examinationType,
      examinationPlace: context.propsValue.examinationPlace,
      comment: context.propsValue.comment,
    };
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.externalId +
          '/register',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
