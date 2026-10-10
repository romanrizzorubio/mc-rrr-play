const createRequestError = (message, status) => {
    const error = new Error(message);
    error.status = status;

    return error;
};

export async function parseApiResponse(response) {
    if (response.status === 204) {
        return undefined;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('json')) {
        if (!response.ok) {
            throw createRequestError(
                `La solicitud falló con el estado HTTP ${response.status}.`,
                response.status
            );
        }

        throw new Error('El servidor devolvió una respuesta que no es JSON.');
    }

    let payload;
    try {
        payload = await response.json();
    } catch (error) {
        if (!(error instanceof SyntaxError)) {
            throw error;
        }

        const message = response.ok ?
            'El servidor devolvió una respuesta JSON no válida.' :
            `La solicitud falló con el estado HTTP ${response.status}.`;

        throw createRequestError(message, response.status);
    }

    if (!response.ok) {
        const errorPayload = payload?.error;
        const message = typeof errorPayload === 'string' ?
            errorPayload :
            errorPayload?.message || payload?.message ||
                `La solicitud falló con el estado HTTP ${response.status}.`;

        throw createRequestError(message, response.status);
    }

    return payload;
}
