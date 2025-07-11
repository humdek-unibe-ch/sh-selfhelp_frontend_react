'use client';

import {
    Paper,
    Title,
    Text,
    Group,
    Badge,
    Stack,
    Box,
    Alert,
    Button,
    TextInput,
    Textarea,
    ActionIcon,
    Tooltip,
    Collapse,
    Tabs,
    Container,
    Card,
    Divider
} from '@mantine/core';
import {
    IconInfoCircle,
    IconDeviceFloppy,
    IconChevronDown,
    IconChevronUp,
    IconLanguage,
    IconSettings
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useHotkeys } from '@mantine/hooks';
import { useState, useEffect, useMemo } from 'react';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { usePageFields } from '../../../../../hooks/usePageDetails';
import { useUpdatePageMutation } from '../../../../../hooks/mutations/useUpdatePageMutation';
import { useLanguages } from '../../../../../hooks/useLanguages';
import { FieldLabelWithTooltip } from '../../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { IPageField } from '../../../../../types/responses/admin/page-details.types';
import { IUpdatePageField, IUpdatePageData, IUpdatePageRequest } from '../../../../../types/requests/admin/update-page.types';
import { debug } from '../../../../../utils/debug-logger';
import { notifications } from '@mantine/notifications';
import styles from './ConfigurationPageEditor.module.css';
import { FieldRenderer, IFieldData } from '../../shared/field-renderer/FieldRenderer';
import { useQueryClient } from '@tanstack/react-query';
import { 
    processAllFields, 
    isContentField, 
    isPropertyField, 
    getFieldTypeDisplayName,
    validateFieldProcessing,
    initializeFieldFormValues
} from '../../../../../utils/field-processing.utils';

interface ConfigurationPageEditorProps {
    page: IAdminPage;
}

interface IConfigFormValues {
    fields: Record<string, Record<number, string>>; // fields[fieldName][languageId] = content
}

export function ConfigurationPageEditor({ page }: ConfigurationPageEditorProps) {
    const [contentExpanded, setContentExpanded] = useState(true);
    const [propertiesExpanded, setPropertiesExpanded] = useState(true);
    const [activeLanguageTab, setActiveLanguageTab] = useState<string>('');
    const queryClient = useQueryClient();

    // Fetch page fields
    const {
        data: pageFieldsData,
        isLoading: fieldsLoading,
        error: fieldsError,
        refetch: refetchPageFields
    } = usePageFields(page.keyword, true);

    // Fetch available languages
    const { languages, isLoading: languagesLoading } = useLanguages();

    // Set default active language tab when languages are loaded
    useEffect(() => {
        if (languages.length > 0 && !activeLanguageTab) {
            const firstLangId = languages[0].id.toString();
            setActiveLanguageTab(firstLangId);
        }
    }, [languages, activeLanguageTab]);

    // Update page mutation
    const updatePageMutation = useUpdatePageMutation({
        onSuccess: () => {
            notifications.show({
                title: 'Success',
                message: 'Configuration saved successfully',
                color: 'green',
            });
            // Refetch page fields to reload the data
            refetchPageFields();
            
            // Invalidate relevant queries to refresh data - using consistent query keys
            queryClient.invalidateQueries({ queryKey: ['adminPages'] }); // Admin pages list
            queryClient.invalidateQueries({ queryKey: ['pageFields', page.keyword] }); // Page fields
            queryClient.invalidateQueries({ queryKey: ['pageSections', page.keyword] }); // Page sections
            queryClient.invalidateQueries({ queryKey: ['pages'] }); // Frontend pages
            queryClient.invalidateQueries({ queryKey: ['page-content'] }); // Frontend page content
            queryClient.invalidateQueries({ queryKey: ['frontend-pages'] }); // Frontend pages with language
            
            // Also invalidate any admin-specific queries that might exist
            queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'page', page.keyword] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'page-fields', page.keyword] });
        }
    });

    // Form for configuration editing
    const form = useForm<IConfigFormValues>({
        initialValues: {
            fields: {}
        }
    });

    // Get description field value
    const descriptionValue = useMemo(() => {
        if (!pageFieldsData?.fields || !languages.length) return '';

        const descriptionField = pageFieldsData.fields.find(f => f.name.toLowerCase() === 'description');
        if (!descriptionField) return '';

        // Get the first language's description
        const firstLang = languages[0];
        const translation = descriptionField.translations.find(t => t.language_id === firstLang.id);
        return translation?.content || '';
    }, [pageFieldsData, languages]);

    // Filter out system fields (title and description) from content fields
    const contentFields = useMemo(() => {
        if (!pageFieldsData?.fields) return [];
        return pageFieldsData.fields.filter(field =>
            isContentField(field) &&
            !['title', 'description'].includes(field.name.toLowerCase())
        );
    }, [pageFieldsData]);

    const propertyFields = useMemo(() => {
        if (!pageFieldsData?.fields) return [];
        return pageFieldsData.fields.filter(field => isPropertyField(field));
    }, [pageFieldsData]);

    // Check if we have multiple languages for content fields
    const hasMultipleLanguages = useMemo(() => {
        return languages.length > 1;
    }, [languages]);

    // Update form when page data changes
    useEffect(() => {
        if (pageFieldsData && languages.length > 0) {
            // Use the modular field initialization utility that handles content vs property fields correctly
            const fieldsObject = initializeFieldFormValues(pageFieldsData.fields, languages);
            
            debug('Form values initialized', 'ConfigurationPageEditor', {
                totalFields: pageFieldsData.fields.length,
                cssFields: pageFieldsData.fields.filter(f => f.type === 'css').map(f => ({
                    name: f.name,
                    type: f.type,
                    display: f.display,
                    isPropertyField: isPropertyField(f),
                    formValues: fieldsObject[f.name],
                    translations: f.translations
                }))
            });

            form.setValues({ fields: fieldsObject });
        }
    }, [pageFieldsData, languages]);

    // Debug: Monitor form value changes for CSS fields
    useEffect(() => {
        if (pageFieldsData?.fields && form.values.fields) {
            const cssFields = pageFieldsData.fields.filter(f => f.type === 'css');
            if (cssFields.length > 0) {
                debug('CSS fields form values changed', 'ConfigurationPageEditor', {
                    cssFields: cssFields.map(field => ({
                        name: field.name,
                        type: field.type,
                        display: field.display,
                        formValues: form.values.fields[field.name],
                        hasValues: !!form.values.fields[field.name],
                        valuesByLanguage: languages.map(lang => ({
                            languageId: lang.id,
                            value: form.values.fields[field.name]?.[lang.id] || '',
                            valueLength: (form.values.fields[field.name]?.[lang.id] || '').length
                        }))
                    }))
                });
            }
        }
    }, [form.values.fields, pageFieldsData?.fields, languages]);

    // Save hotkey (Ctrl+S)
    useHotkeys([
        ['ctrl+S', (e) => {
            e.preventDefault();
            handleSave();
        }]
    ]);

    const handleSave = () => {
        // Debug: Log current form values before processing
        debug('Configuration page save initiated', 'ConfigurationPageEditor', {
            keyword: page.keyword,
            formFields: form.values.fields,
            allFields: pageFieldsData?.fields.map((f: IPageField) => ({ 
                name: f.name, 
                type: f.type, 
                display: f.display,
                displayType: getFieldTypeDisplayName(f),
                currentValue: form.values.fields?.[f.name] 
            }))
        });

        // Validate field processing rules
        const validationWarnings: string[] = [];
        pageFieldsData?.fields.forEach(field => {
            const validation = validateFieldProcessing(field);
            validationWarnings.push(...validation.warnings);
        });
        
        if (validationWarnings.length > 0) {
            debug('Field processing validation warnings', 'ConfigurationPageEditor', {
                warnings: validationWarnings
            });
        }

        // Prepare data - configuration pages don't need page properties
        const pageData: IUpdatePageData = {
            // Keep existing values
            url: page.url,
            headless: pageFieldsData?.page.headless || false,
            navPosition: page.nav_position,
            footerPosition: page.footer_position,
            openAccess: pageFieldsData?.page.openAccess || false,
            pageAccessTypeCode: pageFieldsData?.page.pageAccessType?.lookupCode || '',
        };

        // Use the modular field processing utility
        const processedFields = processAllFields({
            fields: pageFieldsData?.fields || [],
            formValues: form.values.fields || {},
            languages: languages
        });

        const backendPayload: IUpdatePageRequest = {
            pageData,
            fields: processedFields.fieldEntries
        };

        // Debug: Log the final payload with field analysis
        const cssFields = processedFields.fieldEntries.filter(f => {
            const field = pageFieldsData?.fields.find(pf => pf.id === f.fieldId);
            return field?.type === 'css';
        });

        debug('Saving configuration page with modular field processing', 'ConfigurationPageEditor', {
            keyword: page.keyword,
            payload: backendPayload,
            fieldAnalysis: {
                totalFields: pageFieldsData?.fields.length || 0,
                contentFields: processedFields.contentFields.length,
                propertyFields: processedFields.propertyFields.length,
                totalFieldEntries: processedFields.fieldEntries.length,
                cssFieldsCount: cssFields.length,
                cssFields: cssFields.map((cf: IUpdatePageField) => ({
                    fieldId: cf.fieldId,
                    languageId: cf.languageId,
                    content: cf.content || '',
                    contentLength: (cf.content || '').length,
                    fieldName: pageFieldsData?.fields.find((pf: IPageField) => pf.id === cf.fieldId)?.name,
                    fieldType: pageFieldsData?.fields.find((pf: IPageField) => pf.id === cf.fieldId)?.type,
                    isPropertyField: pageFieldsData?.fields.find((pf: IPageField) => pf.id === cf.fieldId) ? 
                        isPropertyField(pageFieldsData.fields.find((pf: IPageField) => pf.id === cf.fieldId)!) : false
                }))
            }
        });

        updatePageMutation.mutate({
            keyword: page.keyword,
            updateData: backendPayload
        });
    };

    // Render content field
    const renderContentField = (field: IPageField, languageId: number) => {
        const currentLanguage = languages.find(lang => lang.id === languageId);
        const locale = hasMultipleLanguages && currentLanguage ? currentLanguage.locale : undefined;
        const fieldValue = form.values.fields?.[field.name]?.[languageId] ?? '';
        
        // Debug: Log CSS field rendering
        if (field.type === 'css') {
            debug('Rendering CSS field', 'ConfigurationPageEditor', {
                fieldName: field.name,
                fieldType: field.type,
                languageId: languageId,
                currentValue: fieldValue,
                valueLength: fieldValue.length
            });
        }
        
        // Convert IPageField to IFieldData
        const fieldData: IFieldData = {
            id: field.id,
            name: field.name,
            type: field.type,
            default_value: field.default_value,
            help: field.help,
            display: field.display
        };
        
        return (
            <FieldRenderer
                key={`${field.id}-${languageId}`}
                field={fieldData}
                value={fieldValue}
                onChange={(value) => {
                    const fieldKey = `fields.${field.name}.${languageId}`;
                    
                    // Debug: Log CSS field changes specifically
                    if (field.type === 'css') {
                        debug('CSS field onChange triggered', 'ConfigurationPageEditor', {
                            fieldName: field.name,
                            fieldKey: fieldKey,
                            newValue: value,
                            newValueLength: String(value).length,
                            previousValue: fieldValue,
                            previousValueLength: fieldValue.length
                        });
                    }
                    
                    form.setFieldValue(fieldKey, value);
                }}
                locale={locale}
            />
        );
    };

    // Render property field
    const renderPropertyField = (field: IPageField, languageId?: number) => {
        // If languageId is provided, use it; otherwise use the first language
        const langId = languageId || languages[0]?.id || 1;
        const fieldValue = form.values.fields?.[field.name]?.[langId] ?? '';
        
        // Debug: Log property field rendering for CSS fields
        if (field.type === 'css') {
            debug('Rendering CSS property field', 'ConfigurationPageEditor', {
                fieldName: field.name,
                fieldType: field.type,
                languageId: langId,
                currentValue: fieldValue,
                valueLength: fieldValue.length
            });
        }
        
        // Convert IPageField to IFieldData
        const fieldData: IFieldData = {
            id: field.id,
            name: field.name,
            type: field.type,
            default_value: field.default_value,
            help: field.help,
            display: field.display
        };
        
        return (
            <FieldRenderer
                field={fieldData}
                value={fieldValue}
                onChange={(value) => {
                    const fieldKey = `fields.${field.name}.${langId}`;
                    
                    // Debug: Log CSS property field changes
                    if (field.type === 'css') {
                        debug('CSS property field onChange triggered', 'ConfigurationPageEditor', {
                            fieldName: field.name,
                            fieldKey: fieldKey,
                            newValue: value,
                            newValueLength: String(value).length,
                            previousValue: fieldValue,
                            previousValueLength: fieldValue.length
                        });
                    }
                    
                    form.setFieldValue(fieldKey, value);
                }}
            />
        );
    };

    if (fieldsLoading || languagesLoading) {
        return (
            <Container size="xl" p="md">
                <Alert color="blue">Loading configuration page...</Alert>
            </Container>
        );
    }

    if (fieldsError) {
        return (
            <Container size="xl" p="md">
                <Alert color="red" title="Error loading page details">
                    {fieldsError.message}
                </Alert>
            </Container>
        );
    }

    return (
        <Box className={styles.backgroundGray} style={{ minHeight: '100vh' }}>
            <Container size="xl" p="md" className={styles.fullHeight}>
                <Stack gap="lg" className={styles.fullHeight}>
                    {/* Info Alert - moved to top */}
                    <Alert
                        icon={<IconInfoCircle size="1.2rem" />}
                        color="blue"
                        variant="light"
                        radius="md"
                    >
                        <Text size="sm">
                            Configuration pages control system-wide settings and behaviors.
                            The <strong>title</strong> and <strong>description</strong> fields are system-managed and cannot be edited directly.
                        </Text>
                    </Alert>

                    {/* Header Section - made smaller */}
                    <Paper shadow="md" p="md" withBorder radius="md" className={styles.headerSection}>
                        <Group justify="space-between" align="center">
                            <Group gap="xs">
                                <Badge color="purple" variant="filled" size="md" radius="md">
                                    Configuration Page
                                </Badge>
                                <Title order={2} fw={600}>
                                    {page.title || page.keyword}
                                </Title>
                            </Group>
                            <Button
                                leftSection={<IconDeviceFloppy size="1rem" />}
                                onClick={handleSave}
                                size="sm"
                                loading={updatePageMutation.isPending}
                                radius="sm"
                            >
                                Save
                            </Button>
                        </Group>
                        <Group>
                            {descriptionValue && (
                                <Text c="dimmed" size="sm" ml="xs" mt="xs">
                                    {descriptionValue}
                                </Text>
                            )}
                        </Group>
                    </Paper>

                    {/* Content Section */}
                    {contentFields.length > 0 && (
                        <Card shadow="sm" withBorder radius="md">
                            <Card.Section
                                p="md"
                                className={styles.contentSectionHeader}
                                onClick={() => setContentExpanded(!contentExpanded)}
                            >
                                <Group justify="space-between">
                                    <Group gap="sm">
                                        <IconLanguage size={20} color="var(--mantine-color-blue-6)" />
                                        <Title order={4}>Content</Title>
                                        <Badge color="blue" variant="light" size="sm">{contentFields.length} fields</Badge>
                                    </Group>
                                    <ActionIcon variant="subtle" size="md">
                                        {contentExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                                    </ActionIcon>
                                </Group>
                            </Card.Section>

                            <Collapse in={contentExpanded}>
                                <Card.Section p="lg">
                                    {hasMultipleLanguages ? (
                                        <Tabs value={activeLanguageTab} onChange={(value) => setActiveLanguageTab(value || languages[0]?.id.toString() || '')}>
                                            <Tabs.List mb="md">
                                                {languages.map(lang => {
                                                    const langId = lang.id.toString();
                                                    return (
                                                        <Tabs.Tab key={langId} value={langId} fw={500}>
                                                            {lang.language}
                                                        </Tabs.Tab>
                                                    );
                                                })}
                                            </Tabs.List>

                                            {languages.map(lang => {
                                                const langId = lang.id.toString();
                                                return (
                                                    <Tabs.Panel key={langId} value={langId}>
                                                        <div className={styles.fieldGrid}>
                                                            {contentFields.map(field => (
                                                                <div key={field.id}>
                                                                    {renderContentField(field, lang.id)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </Tabs.Panel>
                                                );
                                            })}
                                        </Tabs>
                                    ) : (
                                        <div className={styles.fieldGrid}>
                                            {contentFields.map(field => (
                                                <div key={field.id}>
                                                    {renderContentField(field, languages[0]?.id || 1)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card.Section>
                            </Collapse>
                        </Card>
                    )}

                    {/* Properties Section */}
                    {propertyFields.length > 0 && (
                        <Card shadow="sm" withBorder radius="md">
                            <Card.Section
                                p="md"
                                className={styles.propertiesSectionHeader}
                                onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                            >
                                <Group justify="space-between">
                                    <Group gap="sm">
                                        <IconSettings size={20} color="var(--mantine-color-purple-6)" />
                                        <Title order={4}>Properties</Title>
                                        <Badge color="purple" variant="light" size="sm">{propertyFields.length} properties</Badge>
                                    </Group>
                                    <ActionIcon variant="subtle" size="md">
                                        {propertiesExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                                    </ActionIcon>
                                </Group>
                            </Card.Section>

                            <Collapse in={propertiesExpanded}>
                                <Card.Section p="lg">
                                    {hasMultipleLanguages ? (
                                        <Tabs value={activeLanguageTab} onChange={(value) => setActiveLanguageTab(value || languages[0]?.id.toString() || '')}>
                                            <Tabs.List mb="md">
                                                {languages.map(lang => {
                                                    const langId = lang.id.toString();
                                                    return (
                                                        <Tabs.Tab key={langId} value={langId} fw={500}>
                                                            {lang.language}
                                                        </Tabs.Tab>
                                                    );
                                                })}
                                            </Tabs.List>

                                            {languages.map(lang => {
                                                const langId = lang.id.toString();
                                                return (
                                                    <Tabs.Panel key={langId} value={langId}>
                                                        <div className={styles.fieldGrid}>
                                                            {propertyFields.map(field => (
                                                                <div key={field.id}>
                                                                    {renderPropertyField(field, lang.id)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </Tabs.Panel>
                                                );
                                            })}
                                        </Tabs>
                                    ) : (
                                        <div className={styles.fieldGrid}>
                                            {propertyFields.map(field => (
                                                <div key={field.id}>
                                                    {renderPropertyField(field)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card.Section>
                            </Collapse>
                        </Card>
                    )}
                </Stack>
            </Container>
        </Box>
    );
} 