import {LitElement, html} from 'lit-element';

class MdDeckApp extends LitElement {
    render() {
        return html`
            <main>
                <h1>md-deck</h1>
                <p>Hello world</p>
            </main>
        `;
    }
}

if (!window.customElements.get('md-deck-app')) {
    window.customElements.define('md-deck-app', MdDeckApp);
}
