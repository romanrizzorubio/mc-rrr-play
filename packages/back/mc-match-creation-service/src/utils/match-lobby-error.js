export const createMatchLobbyError = (message, statusCode, options) =>
    Object.assign(new Error(message, options), {statusCode});
