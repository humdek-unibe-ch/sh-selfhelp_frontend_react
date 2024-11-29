/**
 * Service for handling navigation-related API calls.
 * Provides methods for fetching application routes and navigation structure.
 * 
 * @module services/navigation.service
 */

import { IApiResponse } from '@/types/api/requests.type';
import { INavigationItem } from '@/types/api/navigation.type';
import { apiClient } from './api.service';
import { API_CONFIG } from '@/config/api.config';

export const NavigationService = {
    /**
     * Fetches all available routes and navigation items from the API.
     * @returns {Promise<INavigationItem[]>} Array of navigation items
     * @throws {Error} When API request fails
     */
    async getRoutes(): Promise<INavigationItem[]> {
        const response = await apiClient.get<IApiResponse<INavigationItem[]>>(API_CONFIG.ENDPOINTS.ALL_ROUTES);
        return response.data.data;
    }
};
