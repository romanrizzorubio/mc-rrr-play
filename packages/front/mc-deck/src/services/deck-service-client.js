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
        };
        if (body !== undefined) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(new URL(endpoint, this.serviceUrl), options);
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
