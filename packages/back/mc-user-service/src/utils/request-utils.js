export const asyncHandler = handler => (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
};

export const sendError = (error, _request, response, next) => {
    if (response.headersSent) {
        return next(error);
    }

    const requestedStatus = error.statusCode ?? error.status;
    const status = Number.isInteger(requestedStatus) &&
        requestedStatus >= 400 &&
        requestedStatus <= 599 ?
        requestedStatus :
        500;
    const message = status === 503 ?
        error.message || 'El servicio no está disponible temporalmente.' :
        status < 500 ?
            error.message || 'La solicitud no es válida.' :
            'Error interno del servidor.';

    if (status >= 500) {
        console.error('User service request failed', {
            name: error.name,
            code: error.code,
        });
    }

    response.status(status).json({
        error: {
            message,
            status,
        },
    });
};
