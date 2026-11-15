import {ENDPOINTS} from 'mc-endpoints';

export class DeckServiceClient {
    constructor(serviceUrl) {
        this.serviceUrl = serviceUrl;
    }
    async request(endpoint, {method = 'GET', body} = {}) {
        if (!this.serviceUrl) {
            throw new Error('No se configuró la URL de mc-deck-service.');
        }

        const options = {
            method,
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
        };
        if (body !== undefined) {
            options.body = JSON.stringify(body);
        }

        const serviceUrl = this.serviceUrl.endsWith('/') ?
            this.serviceUrl :
            `${this.serviceUrl}/`;
        const endpointPath = endpoint.startsWith('/') ?
            endpoint.substring(1) :
            endpoint;
        const response = await fetch(new URL(endpointPath, serviceUrl), options);
        const result = response.status === 204 ? null : await response.json();
        if (!response.ok) {
            throw new Error(result?.error?.message || `Error HTTP ${response.status}.`);
        }

        return result;
    }
    getHeroes() {
        return this.request(ENDPOINTS.DECK.GET_HEROES_LIST);
    }
    getCatalog(heroId) {
        const query = new URLSearchParams({hero: heroId});

        return this.request(`${ENDPOINTS.DECK.GET_CATALOG}?${query}`);
    }
    getDecks(heroId) {
        const query = heroId ? `?${new URLSearchParams({hero: heroId})}` : '';

        return this.request(`${ENDPOINTS.DECK.LIST}${query}`);
    }
    getDeck(deckId) {
        return this.request(
            `${ENDPOINTS.DECK.LIST}/${encodeURIComponent(deckId)}`,
        );
    }
    saveDeck(deck) {
        const {id, name, heroId, aspect, cards} = deck;

        return this.request(ENDPOINTS.DECK.LIST, {
            method: 'POST',
            body: {
                ...(id ? {id} : {}),
                name,
                heroId,
                aspect,
                cards,
            },
        });
    }
    cloneDeck(deck) {
        const {name, heroId, aspect, cards} = deck;

        return this.saveDeck({
            name: `Clon de ${name}`.slice(0, 100),
            heroId,
            aspect,
            cards,
        });
    }
    setDeckFavorite(deckId, isFavorite) {
        const endpoint = ENDPOINTS.DECK.FAVORITE.replace(
            ':id',
            encodeURIComponent(deckId),
        );

        return this.request(endpoint, {
            method: isFavorite ? 'POST' : 'DELETE',
        });
    }
    deleteDeck(deckId) {
        return this.request(
            `${ENDPOINTS.DECK.LIST}/${encodeURIComponent(deckId)}`,
            {method: 'DELETE'},
        );
    }
    restoreRepositoryDecks() {
        return this.request(ENDPOINTS.DECK.RESTORE_REPOSITORY, {method: 'POST'});
    }
    saveRepositoryDeckSnapshot() {
        return this.request(ENDPOINTS.DECK.SAVE_REPOSITORY, {method: 'POST'});
    }
}
