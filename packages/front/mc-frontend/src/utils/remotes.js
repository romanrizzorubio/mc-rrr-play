let runtimeConfigPromise;

export const loadRuntimeConfig = () => {
    if (!runtimeConfigPromise) {
        runtimeConfigPromise = fetch('/app-config.json')
            .then(async response => {
                if (!response.ok) {
                    throw new Error(`No se pudo cargar app-config.json (${response.status}).`);
                }

                return response.json();
            })
            .then(config => {
                if (!config.services?.match || !config.services?.matchCreation ||
                    !config.services?.deck ||
                    !config.remotes?.mcMatch || !config.remotes?.mcDeck ||
                    !config.remotes?.mcStatic) {
                    throw new Error('app-config.json no contiene todas las URL de servicios y remotos.');
                }

                return config;
            });
    }

    return runtimeConfigPromise;
};

export const loadRemote = async remoteName => {
    const config = await loadRuntimeConfig();
    const remoteUrl = config.remotes[remoteName];
    if (typeof remoteUrl !== 'string') {
        throw new Error(`No existe una URL configurada para el remoto "${remoteName}".`);
    }

    const url = new URL(remoteUrl, window.location.origin);
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error(`La URL del remoto "${remoteName}" debe usar HTTP o HTTPS.`);
    }

    return import(/* @vite-ignore */ url.href);
};

export const getStaticAssetUrl = path => {
    const {getAssetUrl} = window.mcStaticRemote || {};
    if (typeof getAssetUrl !== 'function') {
        throw new Error('El remoto mc-static no está inicializado.');
    }

    return getAssetUrl(path);
};
