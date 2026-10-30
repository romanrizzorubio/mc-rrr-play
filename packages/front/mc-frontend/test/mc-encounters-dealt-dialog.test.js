import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {define() {}},
    mcStaticRemote: {getAssetUrl: path => path},
};
const {McEncountersDealtDialog} = await import(
    '../src/components/dialog/mc-encounters-dealt-dialog/mc-encounters-dealt-dialog.js'
);

describe('encounters dealt dialog', () => {
    const renderTemplate = value => {
        if (Array.isArray(value)) {
            return value.map(renderTemplate).join('');
        }
        if (value && Array.isArray(value.strings) && Array.isArray(value.values)) {
            return value.strings.map((part, index) =>
                `${part}${renderTemplate(value.values[index])}`).join('');
        }
        return value === null || value === undefined || typeof value === 'boolean' ?
            '' : String(value);
    };
    const createDialog = data => Object.assign(
        Object.create(McEncountersDealtDialog.prototype), {data});

    test('shows each player name above one encounter back and their own count below', () => {
        const dialog = createDialog({
            encounters: [
                {name: 'Capitán América', count: 3},
                {name: 'Capitana Marvel', count: 1},
            ],
        });
        const markup = renderTemplate(dialog.renderContent());
        assert.equal((markup.match(/<mc-card-image\b/g) || []).length, 2);
        assert.match(markup, /class="player-name">Capitán América<\/h3>[\s\S]*?src="images\/cards\/back\/encounter\.jpg"[\s\S]*?aria-label="3 cartas repartidas"[\s\S]*?>3<\/div>/);
        assert.match(markup, /class="player-name">Capitana Marvel<\/h3>[\s\S]*?src="images\/cards\/back\/encounter\.jpg"[\s\S]*?aria-label="1 carta repartida"[\s\S]*?>1<\/div>/);
    });

    test('never renders encounter identities or a peek control, including legacy payloads', () => {
        const dialog = createDialog({
            encounters: [{
                name: 'Player',
                count: 2,
                cards: [
                    {name: 'Secret card', image: 'secret-image.png', canPeekFacedown: true},
                    {name: 'Other card', image: 'other-secret.png'},
                ],
            }],
        });
        const markup = renderTemplate(dialog.renderContent());
        assert.equal((markup.match(/<mc-card-image\b/g) || []).length, 1);
        assert.doesNotMatch(markup, /Secret card|secret-image|Other card|other-secret|canPeek|<mc-card(?:\s|>)/);
    });

    test('retains hazard icons and the exact explanation of additional encounters', () => {
        const dialog = createDialog({
            hazardIcons: 3,
            encounters: [
                {name: 'First', count: 3, hazardIcons: 2},
                {name: 'Second', count: 2, hazardIcons: 1},
            ],
        });
        const markup = renderTemplate(dialog.renderContent());
        assert.equal((markup.match(/<mc-icon\b/g) || []).length, 3);
        assert.equal(dialog.getSubtitle(),
            'Se reparten 3 cartas de encuentro adicionales por los iconos de riesgo.');
        dialog.data.hazardIcons = 1;
        assert.equal(dialog.getSubtitle(),
            'Se reparte 1 carta de encuentro adicional por el icono de riesgo.');
        dialog.data.hazardIcons = 0;
        assert.equal(dialog.getSubtitle(), '');
    });

    test('shows an explicit zero count and handles an empty player list', () => {
        const dialog = createDialog({
            encounters: [{name: 'Player', count: 0}],
        });
        assert.match(renderTemplate(dialog.renderContent()),
            /aria-label="0 cartas repartidas"[\s\S]*?>0<\/div>/);
        dialog.data.encounters = [];
        assert.doesNotMatch(renderTemplate(dialog.renderContent()), /<mc-card-image\b/);
    });

    test('bottom-aligns player columns even when only some have hazard icons', () => {
        const dialog = createDialog({
            encounters: [
                {name: 'First', count: 1},
                {name: 'Player with a longer name', count: 4, hazardIcons: 3},
            ],
        });
        const markup = renderTemplate(dialog.renderContent());
        assert.equal((markup.match(/<mc-card-image\b/g) || []).length, 2);
        assert.equal((markup.match(/class="hazard-icons"/g) || []).length, 1);
        const styles = McEncountersDealtDialog.styles.map(style => style.cssText).join('');
        assert.match(styles, /\.encounter-players\s*\{[^}]*align-items:\s*flex-end;/u);
        assert.match(styles, /\.player-encounters\s*\{[^}]*flex-direction:\s*column;/u);
    });
});
