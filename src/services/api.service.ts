import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { ApiResponse } from '@/types/api/requests.type';
import { NavigationItem } from '@/types/api/navigation.type';

const apiClient = axios.create({
   baseURL: API_CONFIG.BASE_URL,
   headers: {
      'Content-Type': 'application/json',
   },
   withCredentials: true
});

export const NavigationService = {
    getRoutes: async (): Promise<NavigationItem[]> => {
       const response = await apiClient.get<ApiResponse<NavigationItem[]>>(API_CONFIG.ENDPOINTS.NAVIGATION);
       return response.data.data;
    }
 };
