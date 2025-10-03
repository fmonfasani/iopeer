import { HttpMethod, QueryParams, httpClient } from '@IOpeer/pieces-common';
import { wedofAuth } from '../../..';
import { createAction, DynamicPropsValue, Property } from '@IOpeer/pieces-framework';
import { wedofCommon } from '../../common/wedof';
import dayjs from 'dayjs';

export const searchCertificationFolder = createAction({
    auth: wedofAuth,
    name: 'searchCertificationFolder',
    displayName: 'Rechercher un ou plusieurs dossiers de certifications',
    description: 'Liste les dossiers de certifications en fonction des critÃ¨res sÃ©lectionnÃ©s',
    props: {
        query: Property.ShortText({
            displayName: 'Recherche',
            description: 'Permet d\'effectuer une recherche libre sur les champs nom du candidat, prÃ©nom du candidat, email du candidat, tags, commentaire, id du dossier de certification et phoneNumber',
            required: false
        }),
        period: wedofCommon.period,
        periodForm: Property.DynamicProperties({      
            description: '',      
            displayName: 'ez',      
            required: true,      
            refreshers: ['period'],      
            props: async ({ period }) => {        
                const _period = period as unknown as string;        
                const props: DynamicPropsValue = {};        
                if (_period === 'custom') {          
                    props['since'] = Property.DateTime({            
                        displayName: '(PÃ©riode) Entre le',            
                        description: 'Date au format YYYY-MM-DD',            
                        required: true,          
                    });          
                    props['until'] = Property.DateTime({            
                        displayName: "(PÃ©riode) et jusqu'au",            
                        description: 'Date au format YYYY-MM-DD',            
                        required: true,          
                    });        
                } else if (          
                    ['next', 'future', 'tomorrow'].some((v) =>_period.toLowerCase().includes(v)          
                )) {          
                    props['filterOnStateDate'] = wedofCommon.filterOnStateDateFutureCf;
                        } else if (_period) {
                                    props['filterOnStateDate'] = wedofCommon.filterOnStateDateCf;
                                    }        
                                    return props;
                                },    
                            }),
        state: Property.StaticMultiSelectDropdown({
            displayName: 'Etat du dossier de certification',
            description: 'Permet de n\'obtenir que les dossiers dans l\'Ã©tat d\'obtention de la certification considÃ©rÃ©. Plusieurs Ã©tats peuvent Ãªtre sÃ©lectionnÃ©s.',
            required: false,
            options: {
                options: [
                    { value: 'all', label: 'Tous' },
                    { value: 'toRegister', label: 'Ã€ inscrire' },
                    { value: 'refused', label: 'RefusÃ©' },
                    { value: 'registered', label: 'Inscrit' },
                    { value: 'toTake', label: 'Ã€ passer' },
                    { value: 'toControl', label: 'Ã€ contrÃ´ler' },
                    { value: 'toRetake', label: 'Ã€ repasser' },
                    { value: 'failed', label: 'Ã‰chouÃ©' },
                    { value: 'aborted', label: 'AbandonnÃ©' },
                    { value: 'success', label: 'RÃ©ussi' }
                ]
            }
        }),
        registrationFolderState: Property.StaticMultiSelectDropdown({
            displayName: 'Ã‰tat du dossier de formation',
            description: 'Permet de n\'obtenir que les dossiers dans l\'Ã©tat considÃ©rÃ©. Plusieurs Ã©tats peuvent Ãªtre sÃ©lectionnÃ©s.',
            required: false,
            options: {
                options: [
                    { value: 'notProcessed', label: 'Non traitÃ©' },
                    { value: 'validated', label: 'ValidÃ©' },
                    { value: 'waitingAcceptation', label: 'En attente d\'acceptation' },
                    { value: 'rejectedWithoutTitulaireSuite', label: 'RejetÃ© sans suite titulaire' },
                    { value: 'rejected', label: 'RejetÃ©' },
                    { value: 'rejectedWithoutCdcSuite', label: 'RejetÃ© sans suite CDC' },
                    { value: 'accepted', label: 'AcceptÃ©' },
                    { value: 'inTraining', label: 'En formation' },
                    { value: 'terminated', label: 'TerminÃ©' },
                    { value: 'serviceDoneDeclared', label: 'Service dÃ©clarÃ© fait' },
                    { value: 'serviceDoneValidated', label: 'Service validÃ© fait' },
                    { value: 'canceledByAttendee', label: 'AnnulÃ© par le candidat' },
                    { value: 'canceledByAttendeeNotRealized', label: 'AnnulÃ© par candidat non rÃ©alisÃ©' },
                    { value: 'canceledByOrganism', label: 'AnnulÃ© par l\'organisme' },
                    { value: 'refusedByAttendee', label: 'RefusÃ© par le candidat' },
                    { value: 'refusedByOrganism', label: 'RefusÃ© par l\'organisme' }
                ]
            }
        }),
        sort: Property.StaticDropdown({
            displayName: 'Tri sur critÃ¨re',
            description: 'Trie les rÃ©sultats sur un critÃ¨re',
            required: false,
            options: {
                options: [
                    { value: 'stateLastUpdate', label: "Date du dernier changement d'Ã©tat" },
                    { value: 'id', label: 'ID de base de donnÃ©es' },
                    { value: 'successDate', label: 'Date de rÃ©ussite' }
                ]
            }
        }),
        order: Property.StaticDropdown({
            displayName: 'Ordre',
            description: 'Tri les rÃ©sultats par ordre ascendant ou descendant',
            required: false,
            options: {
                options: [
                    { value: 'asc', label: 'Ascendant' },
                    { value: 'desc', label: 'Descendant' }
                ]
            }
        }),
        cdcState: Property.StaticDropdown({
            displayName: 'Ã‰tat CDC',
            description: 'Permet de n\'obtenir que les dossiers dans l\'Ã©tat considÃ©rÃ© liÃ© Ã  l\'export des dossiers',
            required: false,
            options: {
                options: [
                    { value: 'all', label: 'Tous' },
                    { value: 'notExported', label: 'Jamais accrochÃ©' },
                    { value: 'exported', label: "EnvoyÃ© et en attente de l'accusÃ©" },
                    { value: 'processedOk', label: 'Accrochage rÃ©ussi' },
                    { value: 'processedKo', label: 'Accrochage en erreur' }
                ]
            }
        }),
        cdcExcluded: Property.StaticDropdown({
            displayName: "Exclus de l'accrochage",
            description: "Permet de filtrer les dossiers de certification qui sont exclus de l'accrochage",
            required: false,
            options: {
                options: [
                    { value: true, label: 'Oui' },
                    { value: false, label: 'Non' }
                ]
            }
        }),
        cdcCompliant: Property.StaticDropdown({
            displayName: 'DonnÃ©es apprenant complÃ¨tes',
            description: "Permet de filtrer les dossiers de certification selon le fait qu'ils contiennent les donnÃ©es de l'apprenant obligatoires pour l'accrochage en cas d'obtention de la certification",
            required: false,
            options: {
                options: [
                    { value: true, label: 'Oui' },
                    { value: false, label: 'Non' }
                ]
            }
        }),
        cdcToExport: Property.StaticDropdown({
            displayName: 'Inclus dans les prochains accrochages',
            description: "Permet de filtrer les dossiers de certification qui devront Ãªtre inclus dans les prochains exports pour l'accrochage",
            required: false,
            options: {
                options: [
                    { value: true, label: 'Oui' },
                    { value: false, label: 'Non' }
                ]
            }
        }),
        certifInfo: Property.Array({
            displayName: 'ID certification',
            description: 'Permet de n\'obtenir que les dossiers liÃ©s Ã  la certification considÃ©rÃ©e',
            required: false
        }),
        dataProvider: Property.StaticMultiSelectDropdown({
            displayName: 'Type de financement',
            description: 'Permet de n\'obtenir que les dossiers dans le type considÃ©rÃ©. Plusieurs types peuvent Ãªtre sÃ©lectionnÃ©s.',
            required: false,
            options: {
                options: [
                    { value: 'cpf', label: 'CPF' },
                    { value: 'individual', label: 'Individuel' },
                    { value: 'poleEmploi', label: 'PÃ´le Emploi' },
                    { value: 'company', label: 'Entreprise' },
                    { value: 'opco', label: 'OPCO' },
                    { value: 'opcoCfa', label: 'OPCO CFA' },
                    { value: 'kairosAif', label: 'Kairos AIF' },
                    { value: 'none', label: 'Aucun' }
                ]
            }
        }),
        siret: Property.Array({
            displayName: 'SIRET',
            description: 'Permet de n\'obtenir que les dossiers issus de l\'organisme de formation de siret considÃ©rÃ©. Utilisez "all" pour rÃ©cupÃ©rer tous les dossiers de tous les organismes.',
            required: false,
            defaultValue:['all']
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: "Recherche libre sur les tags",
            required: false
        }),
        format: Property.StaticDropdown({
            displayName: 'Format de sortie',
            description: 'Permet d\'obtenir une liste des dossiers de certification au format json ou csv',
            required: false,
            defaultValue: 'json',
            options: {
                options: [
                    { value: 'json', label: 'JSON' },
                    { value: 'csv', label: 'CSV' }
                ]
            }
        }),
        limit: Property.Number({
            displayName: 'Limite',
            description: 'Nombre de dossiers de certification',
            defaultValue: 100,
            required: false
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'NumÃ©ro de page de la requÃªte',
            defaultValue: 1,
            required: false
        }),
        cdcFile: Property.ShortText({
            displayName: 'Fichier CDC',
            description: 'Permet de filtrer les dossiers de certification exportÃ©s sur un fichier XML liÃ© Ã  l\'accrochage',
            required: false
        }),
        certificatePrintData: Property.StaticDropdown({
            displayName: 'DonnÃ©es d\'impression de certificat',
            description: 'Permet de n\'obtenir que les dossiers pour lesquels un parchemin est en cours d\'impression ou a Ã©tÃ© imprimÃ©',
            required: false,
            options: {
                options: [
                    { value: true, label: 'Oui' },
                    { value: false, label: 'Non' }
                ]
            }
        }),
        columnId: Property.ShortText({
            displayName: 'ID de colonne',
            description: 'Identifiant pour affichage personnalisÃ©',
            required: false
        }),
        registrationFolderCompletionRate: Property.StaticDropdown({
            displayName: "Taux d'avancement",
            description: "Permet de n'obtenir que les dossiers dont le taux d'avancement choisi",
            required: false,
            options: {
                options: [
                    { value: '>80', label: 'SupÃ©rieur Ã  80%' },
                    { value: '<80', label: 'InfÃ©rieur Ã  80%' }
                ]
            }
        }),
        skillSets: Property.ShortText({
            displayName: 'Blocs de compÃ©tences',
            description: 'Permet de n\'obtenir que les dossiers liÃ©s Ã  une certification RNCP pour les blocs de compÃ©tences considÃ©rÃ©s',
            required: false
        }),
        survey: Property.StaticDropdown({
            displayName: "Questionnaire de suivi d'insertion professionnelle",
            description: 'Permet de n\'obtenir que les dossiers pour lesquels un questionnaire doit Ãªtre rÃ©pondu ou a Ã©tÃ© rÃ©pondu',
            required: false,
            options: {
                options: [
                    { label: 'Questionnaire "Situation professionnelle en dÃ©but de cursus" est accessible (EnquÃªte crÃ©Ã©e)', value: 'initialExperienceStartDate',},
                    { label: 'Questionnaire "Situation professionnelle de 6 mois" est accessible', value: 'sixMonthExperienceStartDate',},          
                    { label: 'Questionnaire "Situation professionnelle au moins un an" est accessible', value: 'longTermExperienceStartDate',},          
                    { label: 'Questionnaire "Situation professionnelle en dÃ©but de cursus" rÃ©pondu', value: 'initialExperienceAnsweredDate',},          
                    { label: 'Questionnaire "Situation professionnelle de 6 mois" rÃ©pondu', value: 'sixMonthExperienceAnsweredDate',},          
                    { label: 'Questionnaire "Situation professionnelle au moins un an" rÃ©pondu', value: 'longTermExperienceAnsweredDate',},
                ]
            }
        }),
        metadata: Property.Array({
            displayName: 'DonnÃ©es personnalisÃ©es',
            description: 'tableau associatif clÃ© - valeur, disponible uniquement pour le certificateur',
            required: false,
        }),
        messageState: Property.StaticDropdown({
            displayName: 'Ã‰tat du message',
            description: 'Permet de n\'obtenir que les dossiers liÃ©s Ã  l\'Ã©tat d\'envoi d\'un message considÃ©rÃ©',
            required: false,
            options: {
                options: [
                    { value: 'sent', label: 'Message envoyÃ©' },
                    { value: 'notSent', label: 'Message non envoyÃ©' },
                    { value: 'notSentUnauthorized', label: 'Message non envoyÃ© (non autorisÃ©)' },
                    { value: 'notSentEnforcedConditions', label: 'Message non envoyÃ© (conditions renforcÃ©es)' },
                    { value: 'failed', label: "Ã‰chec de l'envoi" },
                    { value: 'scheduled', label: 'Envoi programmÃ©' }
                ]
            }
        }),
        messageTemplate: Property.ShortText({
            displayName: 'ModÃ¨le de message',
            description: "Permet de n'obtenir que les dossiers pour lequels un message issue du modÃ¨le considÃ©rÃ© a Ã©tÃ© crÃ©Ã© - par dÃ©faut aucun filtre",
            required: false
        })
    },
    async run(context) {
        const props = context.propsValue;
        const params = {
            query: props.query ?? null,
            limit: props.limit ?? null,
            page: props.page ?? null,
            period: props.period ?? null,
            state: props.state && props.state.length > 0 ? props.state.join(',') : null,
            registrationFolderState: props.registrationFolderState && props.registrationFolderState.length > 0 ? props.registrationFolderState.join(',') : null,
            sort: props.sort ?? null,
            order: props.order ?? null,
            cdcState: props.cdcState ?? null,
            cdcExcluded: props.cdcExcluded ?? null,
            cdcCompliant: props.cdcCompliant ?? null,
            cdcToExport: props.cdcToExport ?? null,
            certifInfo: props.certifInfo && props.certifInfo.length > 0 ? props.certifInfo.join(',') : null,
            dataProvider: props.dataProvider && props.dataProvider.length > 0 ? props.dataProvider.join(',') : null,
            siret: props.siret && props.siret.length > 0 ? props.siret.join(',') : null,
            tags: props.tags && props.tags.length > 0 ? props.tags.join(',') : null,
            format: props.format ?? null,
            since: props.periodForm?.['since']
                ? dayjs(props.periodForm['since'])
                    .startOf('day')
                    .format('YYYY-MM-DDTHH:mm:ssZ')
                : null,
            until: props.periodForm?.['until']
                ? dayjs(props.periodForm['until'])
                    .endOf('day')
                    .format('YYYY-MM-DDTHH:mm:ssZ')
                : null,
            filterOnStateDate: props.periodForm?.['filterOnStateDate'] ?? null,
            cdcFile: props.cdcFile ?? null,
            certificatePrintData: props.certificatePrintData ?? null,
            columnId: props.columnId ?? null,
            registrationFolderCompletionRate: props.registrationFolderCompletionRate ?? null,
            skillSets: props.skillSets ?? null,
            survey: props.survey ?? null,
            metadata: context.propsValue.metadata ?? [],
            messageState: props.messageState ?? null,
            messageTemplate: props.messageTemplate ?? null,
        };
        
        const queryParams: QueryParams = {};
        Object.keys(params).forEach((value) => {
            const key = value as keyof typeof params;
            if (params[key] != null && params[key] != undefined) {
                queryParams[value] = params[key] as string;
            }
        });
        
        return (
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                queryParams: queryParams,
                url: wedofCommon.baseUrl + '/certificationFolders',
                headers: {
                     'Content-Type': 'application/json',
                     'X-Api-Key': context.auth as string,
                },
            })
        ).body;
    }
});
