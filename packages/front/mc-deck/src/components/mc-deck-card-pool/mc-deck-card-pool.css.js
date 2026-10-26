import {css} from 'lit-element';

export default css`
  :host {
    display: block;
    min-width: 0;
  }

  h3 {
    font-family: var(--mc-font-title, sans-serif);
    margin-top: 0;
  }

  .card-name {
    font-family: var(--mc-font-title, sans-serif);
  }

  .traits-cell,
  .trait-label {
    font-family: var(--mc-font-trait, sans-serif);
  }

  .trait-separator {
    display: inline-block;
    font-family: var(--mc-font-trait-separator, sans-serif);
  }

  .card-basic > td {
    background-color: #f2f2f2;
  }

  .aspect-aggression > td {
    background-color: #fff0ef;
  }

  .aspect-justice > td {
    background-color: #fffbea;
  }

  .aspect-protection > td {
    background-color: #eff8ef;
  }

  .aspect-leadership > td {
    background-color: #eef5ff;
  }

  .aspect-pool > td {
    background-color: #fff0f6;
  }

  .field,
  .filters {
    margin: 16px 0;
  }

  .filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  md-filled-text-field,
  .filters md-filled-select {
    width: 100%;
  }

  .table-wrap {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }

  table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 8px;
    border-bottom: 1px solid #e0e0e0;
    text-align: left;
    vertical-align: middle;
  }

  th {
    background: #f5f5f5;
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
    font-weight: 600;
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

  tbody tr:last-child td {
    border-bottom: 0;
  }

  .card-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .card-image-button {
    flex: 0 0 auto;
    padding: 0;
    border: 0;
    background: none;
    cursor: zoom-in;
  }

  .card-image-button img {
    width: 40px;
    height: 56px;
    object-fit: contain;
  }

  .card-cell-info {
    display: grid;
    gap: 4px;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .copy-count {
    width: 64px;
    min-height: 40px;
    padding: 4px 6px;
    border: 1px solid #777;
    border-radius: 4px;
    font: inherit;
  }

  .copy-count:focus {
    outline: 2px solid #6750a4;
    outline-offset: 1px;
  }

  .fixed-count {
    white-space: nowrap;
  }

  .add-action {
    text-align: right;
  }

  th:nth-child(1) {
    width: 28%;
  }

  th:nth-child(2) {
    width: 10%;
  }

  th:nth-child(3) {
    width: 11%;
  }

  th:nth-child(4) {
    width: 21%;
  }

  th:nth-child(5) {
    width: 7%;
  }

  th:nth-child(6) {
    width: 10%;
  }

  th:nth-child(7) {
    width: 13%;
  }

  .cost-cell {
    text-align: center;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    clip-path: inset(50%);
  }

  @media (max-width: 700px) {
    .filters {
      grid-template-columns: 1fr;
    }

    th,
    td {
      padding: 6px 4px;
      font-size: 0.85em;
      overflow-wrap: anywhere;
    }

    .card-cell {
      gap: 4px;
    }

    .card-image-button img {
      width: 28px;
      height: 40px;
    }

    th:nth-child(1) {
      width: 25%;
    }

    th:nth-child(2) {
      width: 9%;
    }

    th:nth-child(3) {
      width: 11%;
    }

    th:nth-child(4) {
      width: 21%;
    }

    th:nth-child(5) {
      width: 8%;
    }

    th:nth-child(6) {
      width: 11%;
    }

    th:nth-child(7) {
      width: 15%;
    }

    .copy-count {
      width: 48px;
    }
  }
`;
