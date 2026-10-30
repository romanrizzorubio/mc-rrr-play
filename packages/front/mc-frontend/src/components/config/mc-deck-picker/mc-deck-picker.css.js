import {css} from 'lit-element';

export default css`
  :host {
    display: block;
    --md-sys-color-primary: var(--mc-color-primary, #6750a4);
    --md-sys-color-on-primary: #ffffff;
    --md-sys-color-surface-container-low: #f7f5fb;
    --deck-aspect-aggression-color: #fff0ef;
    --deck-aspect-justice-color: #fffbea;
    --deck-aspect-protection-color: #eff8ef;
    --deck-aspect-leadership-color: #eef5ff;
    --deck-aspect-pool-color: #fff0f6;
  }

  .deck-picker {
    width: 100%;
    box-sizing: border-box;
    margin-top: 12px;
    padding: 16px;
    border: 1px solid #e4e0ea;
    border-radius: 16px;
    background: #fff;
  }

  .deck-picker h3 {
    margin: 0 0 8px;
  }

  .deck-picker-content {
    width: 100%;
  }

  .deck-picker-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .deck-picker-filters md-filled-text-field {
    flex: 2 1 260px;
    min-width: 220px;
  }

  .deck-picker-filters md-filled-select {
    flex: 1 1 220px;
    min-width: 200px;
  }

  .deck-picker-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 4px;
    text-align: left;
    table-layout: fixed;
  }

  .deck-picker-table th,
  .deck-picker-table td {
    padding: 10px 12px;
    border: 0;
  }

  .deck-picker-table col.deck-name-column {
    width: 34%;
  }

  .deck-picker-table col.deck-aspect-column {
    width: 22%;
  }

  .deck-picker-table col.deck-count-column {
    width: 25%;
  }

  .deck-picker-table col.deck-creator-column {
    width: 19%;
  }

  .deck-picker-table th {
    position: sticky;
    top: 0;
    background: #f7f5fb;
  }

  .deck-choice {
    cursor: pointer;
  }

  .deck-choice.selected {
    font-family: var(--mc-font-title, sans-serif);
    font-weight: 700;
  }

  .deck-choice:focus-visible {
    outline: 2px solid var(--mc-color-primary, #6750a4);
    outline-offset: -2px;
  }

  .deck-choice.aspect-aggression > td {
    background-color: var(--deck-aspect-aggression-color);
  }

  .deck-choice.aspect-justice > td {
    background-color: var(--deck-aspect-justice-color);
  }

  .deck-choice.aspect-protection > td {
    background-color: var(--deck-aspect-protection-color);
  }

  .deck-choice.aspect-leadership > td {
    background-color: var(--deck-aspect-leadership-color);
  }

  .deck-choice.aspect-pool > td {
    background-color: var(--deck-aspect-pool-color);
  }

  .deck-choice[style*="linear-gradient"] > td {
    background-color: transparent;
  }

  .deck-picker-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  @media (max-width: 600px) {
    .deck-picker {
      padding: 12px;
    }

    .deck-picker-filters {
      align-items: stretch;
      flex-direction: column;
    }

    .deck-picker-filters md-filled-text-field,
    .deck-picker-filters md-filled-select {
      width: 100%;
      min-width: 0;
    }

    .deck-picker-table th,
    .deck-picker-table td {
      padding: 7px 4px;
      font-size: 0.75rem;
      overflow-wrap: anywhere;
    }
  }
`;
