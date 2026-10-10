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
  }

  .field {
    margin: 16px 0;
  }

  .field md-filled-select,
  .field md-filled-text-field {
    width: 100%;
  }

  .deck-size,
  .draft-help {
    margin: 10px 0;
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

  .save-button {
    margin-top: 20px;
  }

  @media (max-width: 700px) {
    .editor {
      padding: 16px;
    }
  }
`;
