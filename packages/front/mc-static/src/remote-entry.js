const assetRoot = new URL(/* @vite-ignore */ './', import.meta.url);

export const getAssetUrl = path => {
    if (typeof path !== 'string' || path.startsWith('/') || path.split('/').includes('..')) {
        throw new Error('La ruta del recurso estático no es válida.');
    }

    return new URL(path, assetRoot).href;
};
