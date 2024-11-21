import { useQuery } from '@tanstack/react-query';
import { NavigationService } from '@/services/api.service';
import { IRoute } from '@/types/navigation/navigation.types';
import { IMenuitemsType } from '@/types/layout/sidebar';
import { IconPoint } from '@tabler/icons-react';
import { INavigationItem } from '@/types/api/navigation.type';

interface INavigationData {
    routes: IRoute[];
    menuItems: IMenuitemsType[];
}

// Move transform functions outside
function transformToRoutes(items: INavigationItem[]): IRoute[] {
    return items.map(item => ({
        title: item.keyword,
        path: item.url,
        isNav: item.nav_position !== null,
        position: item.nav_position
    }));
}

function transformToMenuItems(items: INavigationItem[]): IMenuitemsType[] {
    return items
        .filter(item => item.nav_position !== null)
        .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0))
        .map(item => {
            const childItems = items
                .filter(child => child.parent === item.id_pages)
                .sort((a, b) => (a.nav_position ?? 0) - (b.nav_position ?? 0));

            const menuItem: IMenuitemsType = {
                id: item.id_pages.toString(),
                title: item.keyword,
                href: item.url,
                icon: null,
                external: false
            };

            if (childItems.length > 0) {
                menuItem.children = childItems.map(child => ({
                    id: child.id_pages.toString(),
                    title: child.keyword,
                    href: child.url,
                    icon: IconPoint,
                    disabled: child.id_pageAccessTypes !== 1,
                    external: false
                }));
            }

            return menuItem;
        });
}

export function useNavigation() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['navigation'],
        queryFn: async () => {
            const data = await NavigationService.getRoutes();
            return {
                routes: transformToRoutes(data),
                menuItems: transformToMenuItems(data)
            };
        },
        staleTime: 1000,
    });

    return {
        routes: data?.routes ?? [],
        menuItems: data?.menuItems ?? [],
        isLoading,
        error
    };
}