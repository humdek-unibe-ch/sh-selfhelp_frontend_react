"use client";

import { ScrollArea, ActionIcon, Tooltip } from '@mantine/core';
import { IconAdjustmentsCog, IconFiles, IconSettingsAutomation, IconPlus, IconUsers, IconShield, IconUserCog, IconPhoto, IconSettings } from '@tabler/icons-react';
import { LinksGroup } from '../../common/navbar-links-group/NavbarLinksGroup';
import { CreatePageModal } from '../pages/create-page/CreatePage';
import classes from './AdminNavbar.module.css';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminPages } from '../../../../hooks/useAdminPages';

export function AdminNavbar() {
    const router = useRouter();
    const { configurationPageLinks, categorizedSystemPages, categorizedRegularPages, isLoading } = useAdminPages();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePageSelect = useCallback((keyword: string) => {
        router.push(`/admin/pages/${keyword}`);
    }, [router]);

    // Helper function to add onClick handlers to system page links
    const addOnClickHandlers = (pages: any[]): any[] => {
        return pages.map(page => ({
            ...page,
            onClick: () => handlePageSelect(page.keyword),
            children: page.children && page.children.length > 0 ? addOnClickHandlers(page.children) : undefined
        }));
    };

    // Build dynamic system pages section
    const systemPagesChildren = useMemo(() => {
        if (isLoading) {
            return [{ label: 'Loading...', link: '#' }];
        }

        const systemPages = [];
        
        if (categorizedSystemPages.authentication.length > 0) {
            systemPages.push({
                label: 'Authentication',
                link: '#',
                children: addOnClickHandlers(categorizedSystemPages.authentication)
            });
        }
        
        if (categorizedSystemPages.profile.length > 0) {
            systemPages.push({
                label: 'User Profile',
                link: '#',
                children: addOnClickHandlers(categorizedSystemPages.profile)
            });
        }
        
        if (categorizedSystemPages.errors.length > 0) {
            systemPages.push({
                label: 'Error Pages',
                link: '#',
                children: addOnClickHandlers(categorizedSystemPages.errors)
            });
        }
        
        if (categorizedSystemPages.legal.length > 0) {
            systemPages.push({
                label: 'Legal Pages',
                link: '#',
                children: addOnClickHandlers(categorizedSystemPages.legal)
            });
        }
        
        if (categorizedSystemPages.other.length > 0) {
            systemPages.push({
                label: 'Other System Pages',
                link: '#',
                children: addOnClickHandlers(categorizedSystemPages.other)
            });
        }

        return systemPages.length > 0 ? systemPages : [{ label: 'No system pages found', link: '#' }];
    }, [categorizedSystemPages, isLoading, handlePageSelect]);

    // Build dynamic regular pages section
    const regularPagesChildren = useMemo(() => {
        if (isLoading) {
            return [{ label: 'Loading...', link: '#' }];
        }

        const regularPages = [];
        
        if (categorizedRegularPages.menu.length > 0) {
            regularPages.push({
                label: 'Menu Pages',
                link: '#',
                children: addOnClickHandlers(categorizedRegularPages.menu)
            });
        }
        
        if (categorizedRegularPages.footer.length > 0) {
            regularPages.push({
                label: 'Footer Pages',
                link: '#',
                children: addOnClickHandlers(categorizedRegularPages.footer)
            });
        }
        
        if (categorizedRegularPages.other.length > 0) {
            regularPages.push({
                label: 'Other Pages',
                link: '#',
                children: addOnClickHandlers(categorizedRegularPages.other)
            });
        }

        return regularPages.length > 0 ? regularPages : [{ label: 'No pages found', link: '#' }];
    }, [categorizedRegularPages, isLoading, handlePageSelect]);

    // Build configuration pages section
    const configurationPagesChildren = useMemo(() => {
        if (isLoading) {
            return [{ label: 'Loading...', link: '#' }];
        }

        return configurationPageLinks.length > 0 
            ? addOnClickHandlers(configurationPageLinks)
            : [{ label: 'No configuration pages found', link: '#' }];
    }, [configurationPageLinks, isLoading, handlePageSelect]);

    const staticNavItems = [
        {
            label: 'Configuration Pages',
            icon: <IconAdjustmentsCog size="1rem" stroke={1.5} />,
            children: configurationPagesChildren
        },
        {
            label: 'System Pages',
            icon: <IconSettingsAutomation size="1rem" stroke={1.5} />,
            children: systemPagesChildren
        },
        {
            label: 'Pages',
            icon: <IconFiles size="1rem" stroke={1.5} />,
            children: regularPagesChildren,
            rightSection: (
                <Tooltip label="Create new page">
                    <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsModalOpen(true);
                        }}
                    >
                        <IconPlus size={14} />
                    </ActionIcon>
                </Tooltip>
            )
        },
        {
            label: 'User Management',
            icon: <IconUserCog size="1rem" stroke={1.5} />,
            children: [
                {
                    label: 'Users',
                    icon: <IconUsers size="0.9rem" stroke={1.5} />,
                    link: '/admin/users'
                },
                {
                    label: 'Groups',
                    icon: <IconUsers size="0.9rem" stroke={1.5} />,
                    link: '/admin/groups'
                },
                {
                    label: 'Roles',
                    icon: <IconShield size="0.9rem" stroke={1.5} />,
                    link: '/admin/roles'
                }
            ]
        },
        {
            label: 'Assets',
            icon: <IconPhoto size="1rem" stroke={1.5} />,
            link: '/admin/assets'
        },
        {
            label: 'Configuration',
            icon: <IconAdjustmentsCog size="1rem" stroke={1.5} />,
            children: [
                {
                    label: 'CMS Preferences',
                    icon: <IconSettings size="0.9rem" stroke={1.5} />,
                    link: '/admin/preferences'
                },
                {
                    label: 'System Config',
                    icon: <IconAdjustmentsCog size="0.9rem" stroke={1.5} />,
                    link: '/admin/configuration'
                }
            ]
        }
    ];

    return (
        <>
            <ScrollArea className={classes.navbar}>
                <div className={classes.navbarMain}>
                    {/* All navigation items with same structure */}
                    {staticNavItems.map((item, index) => (
                        <LinksGroup key={index} {...item} />
                    ))}
                </div>
            </ScrollArea>

            <CreatePageModal
                opened={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
