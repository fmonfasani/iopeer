import { wedofAuth } from '../../../index';
import { createAction, DynamicPropsValue, Property } from '@IOpeer/pieces-framework';
import { HttpMethod, httpClient } from '@IOpeer/pieces-common';
import { wedofCommon } from '../../common/wedof';

export const createCertificationPartnerAudit = createAction({
  auth: wedofAuth,
  name: 'createCertificationPartnerAudit',
  displayName: "CrÃ©er un audit sur un partenariat de certification",
  description: "Permet de crÃ©er un audit sur un partenariat de certification",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'NÂ° certifInfo',
      description: "Permet de n'obtenir que les modÃ¨les liÃ©s Ã  la certification considÃ©rÃ©e",
      required: true,
    }),
    siret: Property.ShortText({
      displayName: 'NÂ° de siret',
      description:
        'SÃ©lectionner le SIRET du partenaire',
      required: true,
    }),
    templateId: Property.DynamicProperties({
      displayName: "Type du modÃ¨le d'audit",
      refreshers: ['certifInfo'],
      required: true,
      props: async ({ auth, certifInfo }) => {
        if (!certifInfo) {
          console.error('certifInfo is undefined');
          return {};
        }
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${wedofCommon.baseUrl}/certificationPartnerAuditTemplates`,
            queryParams: { certifInfo: certifInfo as unknown as string },
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': auth as unknown as string,
            },
          });
    
          const options = response.body.map((template: { id: string; name: string }) => ({
            label: template.name,
            value: template.id,
          }));
    
          return {
            templateId: Property.StaticDropdown({
              displayName: "ModÃ¨le d'audit",
              required: true,
              options: {
                options: options,
              },
            }),
          } as DynamicPropsValue;
    
        } catch (error) {
          console.error('Error fetching templates:', error);
          return {};
        }
      },
    }),
  },
  async run(context) {
     const message = {
      templateId: context.propsValue.templateId['templateId'] ?? null,
      };
      return (
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url:
            wedofCommon.baseUrl +
            '/certifications/' +
            context.propsValue.certifInfo +
            '/partners/'+ context.propsValue.siret + '/audits',
          body: message,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
  },
});
