import {readFile} from 'node:fs/promises';

import cors from 'cors';
import express from 'express';

import {
    parseRepositoryDeckSnapshot,
    REPOSITORY_DECK_SNAPSHOT_PATH,
} from 'mc-data';
import {ENDPOINTS} from 'mc-endpoints';
import {validatePlayerDeck} from 'mc-shared';
import {AuthServiceClient} from './auth-service-client.js';

const createError = (message, statusCode) =>
    Object.assign(new Error(message), {statusCode});

const normalizeDeck = (body, catalog) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw createError('La solicitud del mazo no es válida.', 400);
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const heroId = typeof body.heroId === 'string' ? body.heroId : '';
    const aspect = body.aspect;
    if (aspect !== undefined &&
        typeof aspect !== 'string' &&
        (!Array.isArray(aspect) ||
            aspect.some(selectedAspect => typeof selectedAspect !== 'string'))) {
        throw createError('El aspecto del mazo debe ser un nombre o una lista de nombres.', 400);
    }
    if (!name || name.length > 100) {
        throw createError('El nombre del mazo debe tener entre 1 y 100 caracteres.', 400);
    }
    if (!heroId) {
        throw createError('El mazo debe estar asociado a un superhéroe.', 400);
    }
    if (body.id !== undefined &&
        (typeof body.id !== 'string' || !body.id)) {
        throw createError('El identificador del mazo no es válido.', 400);
    }
    if (!Array.isArray(body.cards) || body.cards.length > catalog.cards.length) {
        throw createError('La lista de cartas del mazo no es válida.', 400);
    }

    const allowedCardIds = new Set(catalog.cards.map(({id}) => id));
    const cardsById = new Map();
    for (const entry of body.cards) {
        if (!entry || typeof entry.id !== 'string' || !allowedCardIds.has(entry.id) ||
            !Number.isInteger(entry.count) || entry.count < 1 || entry.count > 99) {
            throw createError('Cada carta debe tener un ID válido y una cantidad entre 1 y 99.', 400);
        }

        const count = (cardsById.get(entry.id) || 0) + entry.count;
        if (count > 99) {
            throw createError('No puedes guardar más de 99 copias de una carta.', 400);
        }
        cardsById.set(entry.id, count);
    }

    const submittedAspects = Array.isArray(aspect) ?
        [...aspect] :
        aspect ? [aspect] : [];
    const isMultiAspectDeck = catalog.hero.deckBuildingRules?.aspectCount > 1;
    if (!isMultiAspectDeck && submittedAspects.length > 1) {
        throw createError('Este superhéroe solo puede seleccionar un aspecto.', 400);
    }

    return {
        ...(typeof body.id === 'string' && body.id ? {id: body.id} : {}),
        name,
        heroId,
        aspect: isMultiAspectDeck ? submittedAspects : submittedAspects[0] || '',
        cards: [...cardsById].map(([id, count]) => ({id, count})),
    };
};

const addValidation = (deck, catalog, userId, favoriteDeckIds = []) => {
    const publicDeck = {...deck};
    delete publicDeck.creatorId;

    return {
        ...publicDeck,
        canEdit: Boolean(userId && deck.creatorId === userId),
        isFavorite: Boolean(userId && favoriteDeckIds.includes(deck.id)),
        heroName: catalog.hero.name,
        validation: validatePlayerDeck(deck, catalog),
    };
};

const addValidationByHero = async (decks, data, userId, favoriteDeckIds) => {
    const heroIds = [...new Set(decks.map(({heroId}) => heroId))];
    const catalogs = new Map(await Promise.all(heroIds.map(async heroId => {
        const catalog = await data.getDeckEditorCatalog(heroId);
        if (!catalog) {
            throw createError(`No se encontró el superhéroe "${heroId}".`, 404);
        }

        return [heroId, catalog];
    })));

    return decks.map(deck =>
        addValidation(deck, catalogs.get(deck.heroId), userId, favoriteDeckIds));
};

const normalizeRepositoryDecks = async (decks, data) => {
    const heroIds = [...new Set(decks.map(({heroId}) => heroId))];
    const catalogs = new Map(await Promise.all(heroIds.map(async heroId => {
        const catalog = await data.getDeckEditorCatalog(heroId);
        if (!catalog) {
            throw createError(`No se encontró el superhéroe "${heroId}".`, 404);
        }

        return [heroId, catalog];
    })));

    return decks.map(deck => ({
        ...normalizeDeck(deck, catalogs.get(deck.heroId)),
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
    }));
};

const sendError = (error, _req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const requestedStatus = error.statusCode ?? error.status;
    const status = Number.isInteger(requestedStatus) &&
        requestedStatus >= 400 && requestedStatus <= 599 ?
        requestedStatus :
        500;
    const message = status < 500 ?
        error.message || 'Solicitud no válida.' :
        'Error interno del servidor.';

    if (status >= 500) {
        console.error('Deck service request failed', error);
    }

    res.status(status).json({
        error: {
            message,
            status,
        },
    });
};

export const createDeckServiceApp = ({
    data,
    authServiceUrl = process.env.AUTH_SERVICE_URL || 'https://localhost:3003',
    authenticate = AuthServiceClient.authenticate,
    repositoryDeckSnapshotPath = REPOSITORY_DECK_SNAPSHOT_PATH,
}) => {
    const app = express();
    const allowedOrigins = (
        process.env.FRONTEND_ORIGINS ||
        'https://localhost:8000,https://localhost:8100'
    ).split(',').map(origin => origin.trim()).filter(Boolean);
    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
    }));
    app.use(express.json({limit: '100kb'}));
    const authenticateRequest = req =>
        authenticate(req.headers.cookie, authServiceUrl);
    const authenticateAdminRequest = async req => {
        const user = await authenticateRequest(req);
        if (user.isAdmin !== true) {
            throw createError('Solo un administrador puede realizar esta acción.', 403);
        }

        return user;
    };
    const authenticateOptionalRequest = async req => {
        if (typeof req.headers.cookie !== 'string' || !req.headers.cookie.trim()) {
            return null;
        }

        try {
            return await authenticateRequest(req);
        } catch (error) {
            if (error.statusCode === 401) {
                return null;
            }
            throw error;
        }
    };
    const changeDeckFavorite = async (req, res, next, isFavorite) => {
        try {
            const user = await authenticateRequest(req);
            const deck = await data.getDeck(req.params.id);
            if (!deck) {
                throw createError(`No se encontró el mazo "${req.params.id}".`, 404);
            }
            if (deck.creatorId === user.id) {
                throw createError(
                    'Solo puedes marcar como favorito un mazo de otro creador.',
                    400,
                );
            }

            const favorite = await data.setDeckFavorite(
                user.id,
                deck.id,
                isFavorite,
            );
            res.json({isFavorite: favorite});
        } catch (error) {
            next(error);
        }
    };

    app.get('/healthz', (_req, res) => {
        res.json({status: 'ok'});
    });

    app.get(ENDPOINTS.DECK.GET_HEROES_LIST, async (_req, res, next) => {
        try {
            res.json(await data.getDeckHeroesList());
        } catch (error) {
            next(error);
        }
    });

    app.get(ENDPOINTS.DECK.GET_CATALOG, async (req, res, next) => {
        try {
            const heroId = req.query.hero;
            if (typeof heroId !== 'string' || !heroId) {
                throw createError('Indica el superhéroe para cargar el catálogo.', 400);
            }

            const catalog = await data.getDeckEditorCatalog(heroId);
            if (!catalog) {
                throw createError(`No se encontró el superhéroe "${heroId}".`, 404);
            }
            res.json(catalog);
        } catch (error) {
            next(error);
        }
    });

    app.get(ENDPOINTS.DECK.LIST, async (req, res, next) => {
        try {
            const user = await authenticateOptionalRequest(req);
            const favoriteDeckIds = user ?
                await data.getFavoriteDeckIds(user.id) :
                [];
            const heroId = req.query.hero;
            if (heroId === undefined) {
                const decks = await data.getDecksList();
                const withValidation = await addValidationByHero(
                    decks,
                    data,
                    user?.id,
                    favoriteDeckIds,
                );
                res.json(req.query.legal === 'true' ?
                    withValidation.filter(deck => deck.validation.legal) :
                    withValidation);
                return;
            }
            if (typeof heroId !== 'string' || !heroId) {
                throw createError('Indica el superhéroe para buscar sus mazos.', 400);
            }

            const catalog = await data.getDeckEditorCatalog(heroId);
            if (!catalog) {
                throw createError(`No se encontró el superhéroe "${heroId}".`, 404);
            }
            const decks = await data.getDecksList(heroId);
            const withValidation = decks.map(deck =>
                addValidation(deck, catalog, user?.id, favoriteDeckIds));
            res.json(req.query.legal === 'true' ?
                withValidation.filter(deck => deck.validation.legal) :
                withValidation);
        } catch (error) {
            next(error);
        }
    });

    app.post(ENDPOINTS.DECK.SAVE_REPOSITORY, async (req, res, next) => {
        try {
            await authenticateAdminRequest(req);
            const repositorySnapshot = parseRepositoryDeckSnapshot(
                await readFile(repositoryDeckSnapshotPath, 'utf8'),
            );
            res.json(await data.saveRepositoryDeckSnapshot(
                repositorySnapshot,
                repositoryDeckSnapshotPath,
            ));
        } catch (error) {
            next(error);
        }
    });

    app.post(ENDPOINTS.DECK.RESTORE_REPOSITORY, async (req, res, next) => {
        try {
            const user = await authenticateAdminRequest(req);
            const snapshot = parseRepositoryDeckSnapshot(
                await readFile(repositoryDeckSnapshotPath, 'utf8'),
            );
            const repositoryDecks = await normalizeRepositoryDecks(snapshot.decks, data);
            res.json(await data.restoreRepositoryDecks({
                decks: repositoryDecks,
                deletions: snapshot.deletions,
            }, user.id));
        } catch (error) {
            next(error);
        }
    });

    app.get(`${ENDPOINTS.DECK.LIST}/:id`, async (req, res, next) => {
        try {
            const user = await authenticateOptionalRequest(req);
            const favoriteDeckIds = user ?
                await data.getFavoriteDeckIds(user.id) :
                [];
            const deck = await data.getDeck(req.params.id);
            if (!deck) {
                throw createError(`No se encontró el mazo "${req.params.id}".`, 404);
            }

            const catalog = await data.getDeckEditorCatalog(deck.heroId);
            if (!catalog) {
                throw createError(`No se encontró el superhéroe "${deck.heroId}".`, 404);
            }
            res.json(addValidation(deck, catalog, user?.id, favoriteDeckIds));
        } catch (error) {
            next(error);
        }
    });

    app.post(ENDPOINTS.DECK.FAVORITE, (req, res, next) => {
        changeDeckFavorite(req, res, next, true);
    });

    app.delete(ENDPOINTS.DECK.FAVORITE, (req, res, next) => {
        changeDeckFavorite(req, res, next, false);
    });

    app.post(ENDPOINTS.DECK.LIST, async (req, res, next) => {
        try {
            const user = await authenticateRequest(req);
            const heroId = req.body?.heroId;
            if (typeof heroId !== 'string' || !heroId) {
                throw createError('El mazo debe estar asociado a un superhéroe.', 400);
            }

            const catalog = await data.getDeckEditorCatalog(heroId);
            if (!catalog) {
                throw createError(`No se encontró el superhéroe "${heroId}".`, 404);
            }
            const deck = normalizeDeck(req.body, catalog);
            if (deck.id) {
                const existingDeck = await data.getDeck(deck.id);
                if (!existingDeck) {
                    throw createError(`No se encontró el mazo "${deck.id}".`, 404);
                }
                if (existingDeck.heroId !== heroId) {
                    throw createError('No se puede cambiar el superhéroe de un mazo existente.', 400);
                }
                if (existingDeck.creatorId !== user.id) {
                    throw createError('Solo el creador puede editar este mazo.', 403);
                }
            }

            const savedDeck = await data.saveDeck({
                ...deck,
                creatorId: user.id,
            });
            res.status(deck.id ? 200 : 201).json(
                addValidation(savedDeck, catalog, user.id),
            );
        } catch (error) {
            next(error);
        }
    });

    app.delete(`${ENDPOINTS.DECK.LIST}/:id`, async (req, res, next) => {
        try {
            const user = await authenticateRequest(req);
            const deck = await data.getDeck(req.params.id);
            if (!deck) {
                throw createError(`No se encontró el mazo "${req.params.id}".`, 404);
            }
            if (deck.creatorId !== user.id) {
                throw createError('Solo el creador puede eliminar este mazo.', 403);
            }

            const deleted = await data.deleteDeck(req.params.id, user.id);
            if (!deleted) {
                throw createError(`No se encontró el mazo "${req.params.id}".`, 404);
            }
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    });

    app.use((_req, res) => {
        res.status(404).json({
            error: {
                message: 'No se encontró la ruta solicitada.',
                status: 404,
            },
        });
    });
    app.use(sendError);

    return app;
};
