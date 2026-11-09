import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
    justify-content: start;
  }

  mc-superhero-card {
    margin-left: 16px;
    margin-right: 16px;
  }

  .superhero-card-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    align-self: flex-end;
  }

  .panel {
    display: flex;
    align-items: center;
  }

  .extra-decks {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .player-decks {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-self: flex-end;
    gap: 8px;
  }

  mc-game-zone.panel {
    align-self: flex-end;
    flex: 1 1 300px;
    min-width: 300px;
  }
`;
