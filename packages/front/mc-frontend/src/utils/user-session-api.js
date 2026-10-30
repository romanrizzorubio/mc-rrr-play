import {ENDPOINTS} from 'mc-endpoints';
import {parseApiResponse} from './api-response.js';

export class UserSessionApi {
    constructor(serviceUrl) {
        this.serviceUrl = serviceUrl;
    }
    async request(endpoint, method = 'GET') {
        const response = await fetch(new URL(endpoint, this.serviceUrl), {
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
