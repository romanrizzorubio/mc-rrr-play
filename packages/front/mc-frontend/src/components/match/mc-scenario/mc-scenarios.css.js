import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .scenario-board,
  .scenario-zone-cards {
    display: grid;
    align-items: flex-start;
    gap: 16px;
    min-width: 0;
  }

  .scenario-board {
    grid-template-columns: auto minmax(0, 1fr) auto;
    width: 100%;
  }

  .schemes {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }

  .schemes.has-environment-area {
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    gap: 24px;
  }

  .scheme-cards {
    display: flex;
    flex: 0 1 auto;
    flex-direction: column;
    align-items: center;
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
    grid-template-columns: minmax(0, 1fr) auto;
    flex: 1 1 auto;
  }

  .zone-players {
    font-weight: bold;
    text-align: center;
    width: 100%;
  }

  .environments {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    min-width: 0;
    gap: 8px;
  }

  .environment-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 0;
  }

  .main-scheme-decks,
  .extra-decks {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-width: 0;
    width: 100%;
    gap: 8px;
  }

  mc-villain-card {
    justify-self: center;
  }
`;
