import {css} from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .deck-list {
    margin-top: 24px;
  }

  h2,
  p {
    margin-top: 0;
  }

  h2,
  .deck-name {
    font-family: var(--mc-font-title, sans-serif);
  }

  .deck-list-heading,
  .deck-list-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .deck-list-heading {
    margin-bottom: 20px;
  }

  .deck-list-heading h2 {
    margin-bottom: 0;
  }

  .deck-list-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .deck-list-toolbar {
    margin-bottom: 16px;
  }

  .deck-filter {
    flex: 1;
    min-width: 0;
  }

  .deck-filter md-filled-text-field {
    width: 100%;
  }

  .deck-table {
    overflow: hidden;
  }

  .deck-table-header,
  .deck-row-fields {
    display: grid;
    grid-template-columns:
      minmax(0, 2fr)
      minmax(0, 1.5fr)
      minmax(0, 1fr)
      minmax(5rem, 0.6fr);
    align-items: center;
    gap: 16px;
  }

  .deck-table-header {
    grid-template-columns:
      minmax(0, 2fr)
      minmax(0, 1.5fr)
      minmax(0, 1fr)
      minmax(5rem, 0.6fr)
      max-content;
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    color: #616161;
    font-size: 0.875em;
    font-weight: 600;
  }

  .deck-table-header span:last-child {
    width: 80px;
  }

  .sort-button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .sort-button:focus-visible {
    outline: 2px solid #6750a4;
    outline-offset: 2px;
  }

  .sort-indicator {
    flex: 0 0 auto;
    opacity: 0.7;
  }

  .deck-rows {
    display: grid;
  }

  .deck-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) max-content;
    align-items: stretch;
    min-width: 0;
  }

  .deck-row.aspect-basic {
    background-color: #f2f2f2;
  }

  .deck-row.aspect-aggression {
    background-color: #fff0ef;
  }

  .deck-row.aspect-justice {
    background-color: #fffbea;
  }

  .deck-row.aspect-protection {
    background-color: #eff8ef;
  }

  .deck-row.aspect-leadership {
    background-color: #eef5ff;
  }

  .deck-row.aspect-pool {
    background-color: #fff0f6;
  }

  .deck-row + .deck-row {
    border-top: 1px solid #e0e0e0;
  }

  .deck-row-main {
    min-width: 0;
    --md-list-item-container-color: transparent;
  }

  .deck-row-fields {
    width: 100%;
  }

  .deck-row-fields > span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .deck-name {
    font-weight: 600;
  }

  .deck-size {
    text-align: right;
  }

  .deck-size .sort-button {
    justify-content: flex-end;
  }

  .deck-row-action {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
    padding: 0 8px;
  }

  .delete {
    --md-text-button-label-text-color: #b3261e;
    --md-text-button-hover-label-text-color: #b3261e;
  }

  .field-label {
    display: none;
  }

  @media (max-width: 700px) {
    .deck-list {
      padding: 16px;
    }

    .deck-list-heading,
    .deck-list-toolbar {
      align-items: stretch;
      flex-direction: column;
    }

    .deck-list-actions {
      justify-content: flex-end;
    }

    .deck-table-header {
      display: none;
    }

    .deck-row-fields {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px 12px;
    }

    .deck-row-fields > span:not(.deck-name) {
      display: grid;
      gap: 2px;
    }

    .field-label {
      display: block;
      color: #616161;
      font-size: 0.75em;
      font-weight: 400;
    }
  }
`;
