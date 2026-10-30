export class AuthServiceClient {
    static async authenticate(cookie, serviceUrl = process.env.AUTH_SERVICE_URL ||
        'https://localhost:3003') {
        if (typeof cookie !== 'string' || !cookie.trim()) {
            const error = new Error('Se requiere una sesión autenticada.');
            error.statusCode = 401;
            throw error;
        }

        let endpoint;
        try {
            endpoint = new URL(serviceUrl);
            endpoint.pathname = `${endpoint.pathname.replace(/\/+$/, '')}/me`;
            endpoint.search = '';
            endpoint.hash = '';
        } catch {
            throw new Error('AUTH_SERVICE_URL no es una URL válida.');
        }
        if (!['http:', 'https:'].includes(endpoint.protocol)) {
            throw new Error('AUTH_SERVICE_URL debe usar http:// o https://');
        }

        let response;
        try {
            response = await fetch(endpoint, {headers: {cookie}});
        } catch (cause) {
            const error = new Error('No se pudo validar la sesión.', {cause});
            error.statusCode = 502;
            throw error;
        }
        if (response.status === 401 || response.status === 403) {
            const error = new Error('La sesión no es válida.');
            error.statusCode = 401;
            throw error;
        }
        if (!response.ok) {
            const error = new Error('El servicio de autenticación no está disponible.');
            error.statusCode = 502;
            throw error;
        }

        let body;
        try {
            body = await response.json();
        } catch (cause) {
            const error = new Error('El servicio de autenticación devolvió una respuesta no válida.', {cause});
            error.statusCode = 502;
            throw error;
        }
        const {id, name} = body?.user || {};
        if (typeof id !== 'string' || !id.trim() ||
            typeof name !== 'string' || !name.trim()) {
            const error = new Error('El servicio de autenticación devolvió una identidad no válida.');
            error.statusCode = 502;
            throw error;
        }

        return {id: id.trim(), name: name.trim()};
    }
}
