import {getStaticAssetUrl} from '../utils/remotes.js';

export {
    BACK_CARD_EMPTY,
    BACK_CARD_ENCOUNTER,
    BACK_CARD_PLAYER,
    BACK_CARD_VILLAIN,
} from 'mc-shared';

const CARD_ASSET_DIRECTORY = 'images/cards/';

export const getCardAssetUrl = image => getStaticAssetUrl(`${CARD_ASSET_DIRECTORY}${image}`);
