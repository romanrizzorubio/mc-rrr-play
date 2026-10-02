import {readdir, readFile} from 'node:fs/promises';
import {normalizeCatalog} from './normalize.js';

const loadRecords = async directory => {
    const entries = await readdir(directory, {withFileTypes: true});
    const records = [];

    entries.sort((left, right) => (
        left.name < right.name ? -1 : left.name > right.name ? 1 : 0
    ));
    for (const entry of entries) {
        const entryUrl = new URL(
            `${encodeURIComponent(entry.name)}${entry.isDirectory() ? '/' : ''}`,
            directory,
        );

        if (entry.isDirectory()) {
            records.push(...await loadRecords(entryUrl));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            const loaded = JSON.parse(await readFile(entryUrl, 'utf8'));
            records.push(...(Array.isArray(loaded) ? loaded : [loaded]));
        }
    }

    return records;
};

export const loadCatalog = async () => {
    const catalogUrl = new URL('./catalog/', import.meta.url);
    const categories = ['aspects', 'heroes', 'scenarios', 'sets'];
    const records = await Promise.all(categories.map(async category => [
        category,
        await loadRecords(new URL(`${category}/`, catalogUrl)),
    ]));

    return normalizeCatalog(Object.fromEntries(records));
};
