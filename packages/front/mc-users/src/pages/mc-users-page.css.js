import {css} from 'lit-element';

export default css`
  :host {
    display: block;
    color: var(--mc-color-text, #202124);
    font-family: var(--mc-font-body, Arial, sans-serif);
    --md-sys-color-primary: var(--mc-color-primary, #6750a4);
    --md-sys-color-on-primary: #ffffff;
    --md-sys-color-surface-container-low: #f7f5fb;
    --md-sys-color-on-surface: #202124;
  }

  main {
    box-sizing: border-box;
    max-width: 560px;
    margin: 32px auto;
    padding: 32px;
    border: 1px solid #e4e0ea;
    border-radius: 24px;
    background: var(--md-sys-color-surface-container-low);
    box-shadow: 0 2px 6px rgb(0 0 0 / 8%), 0 8px 20px rgb(0 0 0 / 6%);
  }

  h1 {
    margin: 0 0 24px;
    font-family: var(--mc-font-title, Arial, sans-serif);
    font-size: 1.75rem;
    font-weight: 500;
  }

  form {
    display: grid;
    gap: 18px;
  }

  md-filled-text-field {
    width: 100%;
    --md-filled-text-field-container-shape: 12px 12px 4px 4px;
    --md-filled-text-field-container-color: #efedf4;
    --md-filled-text-field-focus-active-indicator-color:
      var(--mc-color-primary, #6750a4);
    --md-filled-text-field-focus-label-text-color:
      var(--mc-color-primary, #6750a4);
  }

  md-filled-button {
    width: 100%;
    --md-filled-button-container-shape: 100px;
    --md-filled-button-container-color: var(--mc-color-primary, #6750a4);
    --md-filled-button-label-text-color: #ffffff;
  }

  md-elevated-button {
    width: 100%;
    --md-elevated-button-container-shape: 100px;
    --md-elevated-button-container-color: #efedf4;
    --md-elevated-button-label-text-color: var(--mc-color-primary, #6750a4);
  }

  md-text-button {
    --md-text-button-label-text-color: var(--mc-color-primary, #6750a4);
  }

  md-filled-text-field:focus-visible,
  md-filled-button:focus-visible,
  md-elevated-button:focus-visible,
  md-text-button:focus-visible,
  a:focus-visible {
    outline: 3px solid var(--mc-color-primary, #6750a4);
    outline-offset: 2px;
  }

  .password-field {
    display: flex;
    align-items: flex-start;
    gap: 4px;
    min-width: 0;
  }

  .password-field md-filled-text-field {
    flex: 1;
    min-width: 0;
  }

  .password-field md-text-button {
    flex: 0 0 auto;
    align-self: flex-start;
    margin: 0;
    margin-block-start: 8px;
  }

  .links {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px 18px;
    margin-top: 18px;
  }

  a {
    color: var(--mc-color-primary, #6750a4);
    font-weight: 500;
  }

  .notice,
  .error {
    margin: 14px 0 0;
    padding: 12px 16px;
    border-radius: 12px;
  }

  .notice {
    background: #e5f3e8;
    color: #174b2b;
  }

  .error {
    background: #fce8e6;
    color: #8d1c16;
  }

  .password-guidance {
    margin: 0;
    color: #5f5b66;
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .email {
    overflow-wrap: anywhere;
    font-weight: 700;
  }

  main.admin-page {
    max-width: 1040px;
  }

  .admin-page h1 {
    margin-bottom: 12px;
  }

  .admin-users-table-wrap {
    overflow-x: auto;
  }

  .admin-users-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .admin-users-table th,
  .admin-users-table td {
    padding: 12px;
    border-bottom: 1px solid #e4e0ea;
    vertical-align: top;
  }

  .admin-users-table th {
    font-weight: 600;
  }

  .admin-user-email,
  .admin-user-status {
    display: block;
    margin-top: 4px;
    color: #5f5b66;
    font-size: 0.9rem;
  }

  .admin-user-row {
    cursor: pointer;
  }

  .admin-user-row:hover,
  .admin-user-row:focus-visible {
    background: #efedf4;
  }

  .admin-user-row:focus-visible {
    outline: 3px solid var(--mc-color-primary, #6750a4);
    outline-offset: -3px;
  }

  .admin-user-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 20px;
  }

  .admin-user-actions md-filled-button {
    width: auto;
  }

  .admin-user-actions .danger {
    --md-filled-button-container-color: #b3261e;
  }

  .admin-user-actions .danger:focus-visible {
    outline-color: #b3261e;
  }

  .admin-user-role {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 24px;
  }

  .admin-user-role input {
    width: 20px;
    height: 20px;
    accent-color: var(--mc-color-primary, #6750a4);
  }

  .admin-user-delete-dialog {
    --md-dialog-container-color: #f7f5fb;
    --md-dialog-headline-color: #202124;
    --md-dialog-supporting-text-color: #5f5b66;
  }

  .admin-user-delete-dialog md-text-button {
    width: auto;
  }

  .admin-user-delete-dialog .danger {
    --md-text-button-label-text-color: #b3261e;
  }

  .friends-section {
    margin-top: 32px;
  }

  .friends-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  .friends-heading h2 {
    margin: 0;
  }

  .friends-heading md-filled-button,
  .friends-list md-text-button,
  .friend-search-dialog md-filled-button {
    width: auto;
  }

  .friends-list {
    display: grid;
    gap: 12px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
  }

  .friends-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid #e4e0ea;
  }

  .friends-list li > div {
    min-width: 0;
  }

  .friend-search-dialog {
    --md-dialog-container-color: #f7f5fb;
    --md-dialog-headline-color: #202124;
    --md-dialog-supporting-text-color: #5f5b66;
  }

  .friend-search-dialog [slot="content"] {
    display: grid;
    gap: 16px;
  }

  .friend-search-dialog form {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .friend-search-dialog form md-filled-text-field {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 600px) {
    main {
      margin: 16px 12px;
      padding: 24px;
    }

    .password-field {
      gap: 0;
    }

    .friends-list li {
      align-items: flex-start;
      flex-direction: column;
    }

    .friend-search-dialog form {
      align-items: stretch;
      flex-direction: column;
    }
  }
`;
