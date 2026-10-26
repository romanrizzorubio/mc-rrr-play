import {css} from 'lit-element';

export default css`
  :host {
    display: block;
    min-width: 0;
  }

  .editor {
    margin-top: 24px;
    padding: 20px;
    border: 1px solid #bdbdbd;
    border-radius: 8px;
  }

  h2,
  p {
    margin-top: 0;
  }

  h2 {
    font-family: var(--mc-font-title, sans-serif);
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .section-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .field {
    margin: 16px 0;
  }

  .field md-filled-select,
  .field md-filled-text-field {
    width: 100%;
  }

  .aspect-selection {
    margin: 0;
    padding: 12px;
    border: 1px solid #bdbdbd;
    border-radius: 4px;
  }

  .aspect-selection legend {
    padding: 0 4px;
  }

  .aspect-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
  }

  .aspect-options label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .aspect-rule {
    margin: 8px 0 0;
  }

  .deck-size,
  .deck-composition,
  .draft-help {
    margin: 10px 0;
  }

  .deck-composition {
    line-height: 1.6;
  }

  .validation {
    margin: 12px 0;
    padding: 12px;
    border-radius: 4px;
    background: #f5f5f5;
  }

  .validation ul {
    margin-bottom: 0;
  }

  .validation.legal {
    color: #1b5e20;
  }

  .validation.draft {
    color: #8a4b08;
  }

  .deck-editor-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }

  .deck-editor-middle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    padding: 12px 0;
    border-block: 1px solid #e0e0e0;
  }

  .deck-editor-middle-counts {
    display: flex;
    align-items: baseline;
    gap: 20px;
    flex-wrap: wrap;
  }

  .deck-editor-middle-counts p {
    margin: 0;
  }

  .save-button {
    margin: 0;
  }

  @media (max-width: 700px) {
    .editor {
      padding: 16px;
    }
  }
`;
