import { css } from 'lit-element';

export default css`
  :host {
    display: block;
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    color: #202124;
    --md-sys-color-primary: var(--mc-color-primary, #6750a4);
    --md-sys-color-on-primary: #ffffff;
    --md-sys-color-surface-container-low: #f7f5fb;
  }

  .section-heading,
  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .match-list {
    display: grid;
    gap: 16px;
    margin: 16px 0;
    padding: 0;
    list-style: none;
  }

  .lobby-table-wrap {
    overflow-x: auto;
    margin: 16px 0;
    border: 1px solid #e4e0ea;
    border-radius: 12px;
    background: var(--md-sys-color-surface-container-low);
  }

  .lobby-table {
    width: 100%;
    min-width: 620px;
    border-collapse: collapse;
    text-align: left;
  }

  .lobby-table th,
  .lobby-table td {
    padding: 10px 16px;
    border-bottom: 1px solid #e4e0ea;
    vertical-align: middle;
  }

  .lobby-table thead th {
    background: #efedf4;
    color: #5f5b66;
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
  }

  .lobby-table tbody tr:last-child th,
  .lobby-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .lobby-table tbody tr:hover {
    background: #f0eef5;
  }

  .lobby-table tbody th {
    font-weight: 600;
    text-align: left;
  }

  .lobby-table .lobby-action {
    width: 1%;
    text-align: right;
    white-space: nowrap;
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

  .match-card {
    padding: 24px;
    border: 1px solid #e4e0ea;
    border-radius: 20px;
    background: var(--md-sys-color-surface-container-low);
    box-shadow: 0 2px 6px rgb(0 0 0 / 8%), 0 8px 20px rgb(0 0 0 / 5%);
  }

  h1,
  .match-card h2 {
    font-family: var(--mc-font-title, sans-serif);
  }

  .match-card h2 {
    margin-top: 0;
    font-weight: 500;
  }

  .match-card md-filled-select {
    display: block;
    width: min(100%, 320px);
    margin: 12px 0;
  }

  .match-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  md-filled-button {
    --md-filled-button-container-shape: 100px;
    --md-filled-button-container-color: var(--mc-color-primary, #6750a4);
    --md-filled-button-label-text-color: #ffffff;
  }

  md-text-button {
    --md-text-button-label-text-color: var(--mc-color-primary, #6750a4);
  }

  .delete-button {
    --md-text-button-label-text-color: #b3261e;
    --md-text-button-hover-label-text-color: #b3261e;
  }

  .create-form {
    margin-top: 16px;
    padding: 24px;
    border: 1px solid #e4e0ea;
    border-radius: 24px;
    background: var(--md-sys-color-surface-container-low);
    box-shadow: 0 2px 6px rgb(0 0 0 / 8%), 0 8px 20px rgb(0 0 0 / 5%);
  }

  @media (max-width: 600px) {
    :host {
      padding: 16px 12px;
    }

    .section-heading,
    .actions {
      align-items: stretch;
      flex-direction: column;
    }

    .match-card,
    .create-form {
      padding: 18px;
      border-radius: 16px;
    }

    .match-card md-filled-select {
      width: 100%;
    }
  }
`;
