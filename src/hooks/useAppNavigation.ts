/**
 * Custom hook for managing application navigation and menu structure.
 * Provides functionality to fetch and transform navigation data from the API
 * into routes and menu items compatible with the application's layout system.
 * 
 * @module hooks/useAppNavigation
 */

import { useQuery } from '@tanstack/react-query';
import { NavigationApi } from '../api/navigation.api';
import { IPageItem } from '../types/responses/frontend/frontend.types';
import { debug } from '../utils/debug-logger';

interface INavigationData {
    pages: IPageItem[];
    menuPages: IPageItem[];
    footerPages: IPageItem[];
    routes: IPageItem[];
    resources?: any[]; // Refine resources for admin mode
}

/**
 * Recursively flattens a tree structure of pages into a flat array
 * @param pages - Array of pages that may contain children
 * @returns Flat array of all pages (including nested children)
 */
function flattenPages(pages: IPageItem[]): IPageItem[] {
    let result: IPageItem[] = [];
    for (const page of pages) {
        // Add the current page (without children to avoid circular references)
        result.push({ ...page, children: [] });
        
        // Recursively add all children
        if (page.children && page.children.length > 0) {
            result = result.concat(flattenPages(page.children));
        }
    }
    return result;
}

/**
 * Unified hook for fetching and managing navigation data for both admin and user interfaces.
 * Uses React Query for data fetching and caching with select to transform data once.
 * @param {Object} options - Configuration options
 * @param {boolean} options.isAdmin - Whether to generate admin resources for Refine
 * @returns {Object} Object containing organized navigation data and query state
 */
export function useAppNavigation(options: { isAdmin?: boolean } = {}) {
    const { isAdmin = false } = options;
    const { data, isLoading, error } = useQuery({
        queryKey: ['pages'],
        queryFn: NavigationApi.getPages,
        staleTime: 1000,
        refetchOnWindowFocus: false,
        select: (pages: IPageItem[]): INavigationData => {
            debug('Transform: Raw pages from API', 'useAppNavigation', { count: pages.length });
            
            // Transform data once and cache the result
            const menuPages = pages
                .filter(page => page.nav_position !== null && !page.is_headless)
                .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

            const footerPages = pages
                .filter(page => page.footer_position !== null && !page.is_headless)
                .sort((a, b) => (a.footer_position ?? 0) - (b.footer_position ?? 0));

            // Flatten ALL pages (including children) for route checking
            const routes = flattenPages(pages);

            const transformResults = {
                totalPages: pages.length,
                menuPages: menuPages.length,
                footerPages: footerPages.length,
                flattenedRoutes: routes.length,
                routeKeywords: routes.map(r => r.keyword)
            };

            debug('Transform: Results', 'useAppNavigation', transformResults);

            // Generate Refine resources for admin mode
            let resources: any[] = [];
            if (isAdmin) {
                resources = pages.map(page => ({
                    name: page.keyword,
                    list: `/admin/pages/${page.keyword}`,
                    show: `/admin/pages/${page.keyword}`,
                    edit: `/admin/pages/${page.keyword}/edit`,
                    create: `/admin/pages/create`,
                    meta: {
                        label: page.keyword,
                        parent: page.parent ? pages.find(p => p.id_pages === page.parent)?.keyword : undefined,
                        canDelete: true,
                        nav: page.nav_position !== null,
                        navOrder: page.nav_position,
                        footer: page.footer_position !== null,
                        footerOrder: page.footer_position,
                        params: page.url.includes('[') ? { nav: { type: 'number' } } : {},
                        protocol: ['web']
                    }
                }));
                
                debug('Generated Refine resources for admin', 'useAppNavigation', { 
                    resourcesCount: resources.length,
                    isAdmin 
                });
            }

            const result = {
                pages,
                menuPages,
                footerPages,
                routes,
                resources
            };

            // Store transformed data in window for DevTools inspection
            if (typeof window !== 'undefined') {
                (window as any).__NAVIGATION_DATA__ = result;
                debug('Transformed data stored in window.__NAVIGATION_DATA__', 'useAppNavigation');
            }

            return result;
        }
    });

    return { 
        pages: data?.pages ?? [], 
        menuPages: data?.menuPages ?? [], 
        footerPages: data?.footerPages ?? [], 
        routes: data?.routes ?? [],
        resources: data?.resources ?? [],
        isLoading, 
        error 
    };
}
