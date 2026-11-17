import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {
        define() {},
    },
};

const {McPlayer} = await import(
    '../src/components/match/mc-player/mc-player.js'
);
const {SuperheroCardComponent} = await import(
    '../src/components/cards/characters/mc-superhero-card/mc-superhero-card.js'
);
const {McCardImage} = await import(
    '../src/components/cards/mc-card-image/mc-card-image.js'
);
const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);

describe('superhero aspect markers', () => {
    test('passes aspect markers from the player state to the superhero card', () => {
        const aspectMarkers = ['aggression', 'justice'];
        const component = Object.assign(Object.create(McPlayer.prototype), {
            player: {
                handSize: 5,
                superhero: {
                    name: 'Spiderwoman',
                    image: 'spiderwoman.png',
                    aspectMarkers,
                    attached: [],
                    tuckedCards: [],
                },
                gameZone: {cards: []},
            },
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            canEndTurn: false,
        });
        const template = component.renderSuperhero();

        assert.match(template.strings.join(''), /\.aspectMarkers=/);
        assert.ok(template.values.includes(aspectMarkers));
    });

    test('passes Gamora aspect markers and outlined markers to the superhero card', () => {
        const aspectMarkers = ['attack', 'thwart'];
        const outlinedAspectMarkers = ['thwart'];
        const component = Object.assign(Object.create(McPlayer.prototype), {
            player: {
                handSize: 5,
                superhero: {
                    name: 'Gamora',
                    image: 'gamora.png',
                    aspectMarkers,
                    outlinedAspectMarkers,
                    attached: [],
                    tuckedCards: [],
                },
                gameZone: {cards: []},
            },
            dragActivation: null,
            dragPlayCard: null,
            dragResourcePayment: null,
            canEndTurn: false,
        });
        const template = component.renderSuperhero();

        assert.match(template.strings.join(''), /\.aspectMarkers=/);
        assert.match(template.strings.join(''), /\.outlinedAspectMarkers=/);
        assert.ok(template.values.includes(aspectMarkers));
        assert.ok(template.values.includes(outlinedAspectMarkers));
    });

    test('passes generic counters from the superhero to its card display', () => {
        const counters = 2;
        const aspectMarkers = ['attack', 'thwart'];
        const outlinedAspectMarkers = ['attack'];
        const component = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                card: {counters},
                aspectMarkers,
                outlinedAspectMarkers,
                abilities: [],
                canEndTurn: false,
                extraMenuOptions: [],
                tuckedCards: [],
            }
        );

        const template = component.render();

        assert.match(template.strings.join(''), /\.generic=/);
        assert.match(template.strings.join(''), /\.showGeneric=/);
        assert.match(template.strings.join(''), /\.aspectMarkers=/);
        assert.match(template.strings.join(''), /\.outlinedAspectMarkers=/);
        assert.ok(template.values.includes(counters));
        assert.ok(template.values.includes(true));
        assert.ok(template.values.includes(aspectMarkers));
        assert.ok(template.values.includes(outlinedAspectMarkers));
    });

    test('renders centered colored dots above the image without a border', () => {
        const component = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                aspectMarkers: [
                    'aggression',
                    'justice',
                    'aggression',
                    'unknown',
                ],
                abilities: [],
                tuckedCards: [],
                obligations: [],
                canEndTurn: false,
                extraTraits: [],
                extraKeywords: [],
            }
        );
        const template = component.render();
        assert.match(template.strings.join(''), /\.aspectMarkers=/);
        assert.ok(template.values.includes(component.aspectMarkers));

        const image = Object.assign(Object.create(McCardImage.prototype), {
            aspectMarkers: component.aspectMarkers,
            src: 'spiderwoman.png',
            size: 'm',
            horizontal: false,
            rotated: false,
        });
        const imageTemplate = image.render();
        const markersTemplate = imageTemplate.values.find(value =>
            value?.strings?.join('').includes('aspect-markers')
        );

        assert.ok(markersTemplate);
        assert.match(markersTemplate.strings.join(''), /aspect-markers/);
        const markerDots = markersTemplate.values[0];
        assert.equal(markerDots.length, 2);
        assert.ok(markerDots[0].values.includes('aggression'));
        assert.ok(markerDots[0].values.includes('Agresividad'));
        assert.ok(markerDots[1].values.includes('justice'));
        assert.ok(markerDots[1].values.includes('Justicia'));

        const styles = McCardImage.styles.cssText;
        assert.match(
            styles,
            /:host\(\.has-aspect-markers\)\s*\{[^}]*margin-top:\s*var\(--aspect-marker-space,\s*16px\)/s
        );
        assert.match(styles, /\.aspect-markers\s*\{[^}]*top:\s*-4px/s);
        assert.match(styles, /\.aspect-markers\s*\{[^}]*left:\s*50%/s);
        assert.match(
            styles,
            /\.aspect-markers\s*\{[^}]*translate\(-50%,\s*-100%\)/s
        );
        assert.doesNotMatch(styles, /\.aspect-marker\s*\{[^}]*border:/s);
        assert.match(
            styles,
            /\.aspect-marker\.aspect-aggression/
        );
        assert.match(
            styles,
            /\.aspect-marker\.aspect-justice/
        );
    });

    test('aligns basic stat labels with the image top edge', () => {
        const card = Object.assign(Object.create(CardComponent.prototype), {
            aspectMarkers: ['aggression', 'attack'],
            showBasicStats: true,
            thwart: 1,
            attack: 1,
            defense: 1,
            scheme: undefined,
            recovery: undefined,
            emphasizedStats: [],
            nameWithStage: false,
            stage: undefined,
            unprintedStats: [],
        });
        const template = card.renderStats();

        assert.ok(template.values.includes('aspect-markers-aligned'));
        assert.match(
            CardComponent.styles.cssText,
            /\.character-stats\.aspect-markers-aligned\s*\{[^}]*margin-top:\s*var\(--aspect-marker-space\)/s
        );
        assert.match(
            CardComponent.styles.cssText,
            /--aspect-marker-space:\s*16px/
        );
    });

    test('renders Gamora event markers in red and yellow with a dark used border', () => {
        const image = Object.assign(Object.create(McCardImage.prototype), {
            aspectMarkers: ['attack', 'thwart'],
            outlinedAspectMarkers: ['thwart'],
            src: 'gamora.png',
            size: 'm',
            horizontal: false,
            rotated: false,
        });
        const template = image.render();
        const markersTemplate = template.values.find(value =>
            value?.strings?.join('').includes('aspect-markers')
        );

        assert.ok(markersTemplate);
        const markers = markersTemplate.values.find(value =>
            Array.isArray(value) && value.length
        );
        assert.equal(markers.length, 2);
        assert.ok(markers[0].values.includes('attack'));
        assert.ok(markers[1].values.includes('thwart'));
        assert.ok(markers[1].values.includes('outlined'));
        assert.ok(markers[0].values.includes('Evento de Ataque jugado'));
        assert.ok(markers[1].values.includes('Respuesta de Intervención usada'));

        const styles = McCardImage.styles.cssText;
        assert.match(styles, /\.aspect-marker\.aspect-attack\s*\{[^}]*#d32f2f/s);
        assert.match(styles, /\.aspect-marker\.aspect-thwart\s*\{[^}]*#fbc02d/s);
        assert.match(
            styles,
            /\.aspect-marker\.outlined\s*\{[^}]*border:\s*2px solid #212121/s
        );
    });

    test('omits the marker overlay when no aspect has been played', () => {
        const component = Object.assign(
            Object.create(McCardImage.prototype),
            {aspectMarkers: []}
        );

        assert.equal(component.renderAspectMarkers(), '');
    });
});
