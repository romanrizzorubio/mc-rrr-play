import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
    justify-content: space-around;
  }

  .schemes {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .environments {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .main-scheme-decks,
  .extra-decks {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
`;
