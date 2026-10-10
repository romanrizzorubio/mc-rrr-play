import { css } from 'lit-element';

export default css`
  :host {
    display: block;
    padding: 16px;
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
    gap: 12px;
    margin: 16px 0;
    padding: 0;
    list-style: none;
  }

  .match-card {
    padding: 16px;
    border: 1px solid #bdbdbd;
    border-radius: 8px;
  }

  h1,
  .match-card h2 {
    font-family: var(--mc-font-title, sans-serif);
  }

  .match-card h2 {
    margin-top: 0;
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

  .delete-button {
    --md-text-button-label-text-color: #b3261e;
    --md-text-button-hover-label-text-color: #b3261e;
  }

  .create-form {
    margin-top: 16px;
  }

  @media (max-width: 600px) {
    .section-heading,
    .actions {
      align-items: stretch;
      flex-direction: column;
    }

    .match-card md-filled-select {
      width: 100%;
    }
  }
`;
