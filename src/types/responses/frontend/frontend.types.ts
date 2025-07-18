import { TStyle } from '../../common/styles.types';
import type { IBaseApiResponse } from '../common/response-envelope.types';

export interface IPageItem {
    id_users: number;
    id_pages: number;
    acl_select: 0 | 1;
    acl_insert: 0 | 1;
    acl_update: 0 | 1;
    acl_delete: 0 | 1;
    keyword: string;
    url: string;
    parent: number | null;
    is_headless: 0 | 1;
    nav_position: number | null;
    footer_position: number | null;
    id_type: number;
    id_pageAccessTypes: number;
    is_system: 0 | 1;
    title: string | null;
    children: IPageItem[];
}

// Updated to match the actual API response structure
export interface IPageContent {
    id: number;
    keyword: string;
    url: string;
    parent_page_id: number | null;
    is_headless: boolean;
    nav_position: number | null;
    footer_position: number | null;
    sections: TStyle[];
}

// Legacy interface for backward compatibility
export interface IPageContentLegacy {
    content: (TStyle | null)[];
    title: string;
    description: string;
    is_headless: boolean;
}

// Removed IFrontendPagesData; API returns data as IPageItem[]
export type TFrontendPagesResponse = IBaseApiResponse<IPageItem[]>;
