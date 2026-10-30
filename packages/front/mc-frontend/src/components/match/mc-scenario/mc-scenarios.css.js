import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .schemes {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1 1 auto;
    min-width: 0;
  }

  .scenario-zones {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: nowrap;
    min-width: 0;
    overflow-x: auto;
    gap: 16px;
  }

  .scenario-play-area {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    flex: 1 0 auto;
    gap: 8px;
  }

  .scenario-zone-cards {
    display: flex;
    flex: 1 1 auto;
    align-items: flex-start;
    gap: 8px;
  }

  .zone-players {
    font-weight: bold;
    text-align: center;
    width: 100%;
  }

  .environments {
    display: flex;
    flex: 0 0 auto;
    align-items: flex-start;
    gap: 8px;
  }

  .main-scheme-decks,
  .extra-decks {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .main-scheme-decks {
    justify-content: center;
    width: 100%;
  }
`;
