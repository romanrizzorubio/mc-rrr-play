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

  .match-card h2 {
    margin-top: 0;
  }

  .match-card label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 0;
  }

  .match-card select {
    min-width: 160px;
  }

  .delete-button {
    margin-left: 8px;
  }

  .create-form {
    margin-top: 16px;
  }

  @media (max-width: 600px) {
    .section-heading,
    .actions,
    .match-card label {
      align-items: stretch;
      flex-direction: column;
    }
  }
`;
