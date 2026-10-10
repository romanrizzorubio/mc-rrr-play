import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .encounter-players {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 24px;
  }

  .player-encounters {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .hazard-icons {
    display: flex;
    justify-content: center;
    gap: 6px;
  }

  .hazard-icons mc-icon {
    font-size: 36px;
    line-height: 1;
  }
`;
