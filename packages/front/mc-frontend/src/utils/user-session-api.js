import {ENDPOINTS} from 'mc-endpoints';
import {parseApiResponse} from './api-response.js';

export class UserSessionApi {
    constructor(serviceUrl) {
        this.serviceUrl = serviceUrl;
    }
    async request(endpoint, method = 'GET') {
        const url = new URL(endpoint.startsWith('/') ? endpoint.substring(1) : endpoint, this.serviceUrl);
        const response = await fetch(url, {
            method,
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
        });
        return parseApiResponse(response);
    }
    async getCurrentUser() {
        try {
            const response = await this.request(ENDPOINTS.USER.ME);

            return response.user;
        } catch (error) {
            if (error.status === 401) {
                return null;
            }

            throw error;
        }
    }
    logout() {
        return this.request(ENDPOINTS.USER.LOGOUT, 'POST');
    }
}
