import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement = class {};
globalThis.window = {
    customElements: {define() {}},
    mcStaticRemote: {getAssetUrl: path => path},
};

const {McEncountersRevealDialog} = await import(
    '../src/components/dialog/mc-encounters-reveal-dialog/mc-encounters-reveal-dialog.js'
);

describe('encounters reveal dialog', () => {
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

    test('centers revealed main schemes in the dialog content', () => {
        const dialog = Object.assign(
            Object.create(McEncountersRevealDialog.prototype),
            {
                data: {
                    card: {
                        image: 'scenarios/kang/main-scheme.webp',
                        isMainScheme: true,
                        name: 'Kang',
                    },
                    horizontal: true,
                },
                readOnly: false,
            }
        );
        const markup = renderTemplate(dialog.renderContent());
        const styles = McEncountersRevealDialog.styles
            .map(style => style.cssText)
            .join('');

        assert.match(markup, /<div class="card-preview">\s*<mc-card/u);
        assert.match(
            styles,
            /\.card-preview\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*center;/su
        );
    });

    test('vertically centers the view-table button with the title', () => {
        const styles = McEncountersRevealDialog.styles
            .map(style => style.cssText)
            .join('');

        assert.match(
            styles,
            /\.title\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;/su
        );
    });
});
