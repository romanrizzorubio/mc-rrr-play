import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
    flex-direction: column;
  }

  .play-card-drop-zone {
    box-sizing: border-box;
    width: 100%;
    min-width: 300px;
    min-height: 200px;
    border-radius: 8px;
    transition: box-shadow 120ms ease, background-color 120ms ease;
  }

  .play-card-drop-zone mc-card-list {
    justify-content: flex-start;
  }

  .play-card-drop-zone.available {
    background-color: rgba(0, 200, 83, 0.08);
    box-shadow:
      0 0 0 3px rgba(0, 200, 83, 0.85),
      0 0 16px rgba(0, 200, 83, 0.6);
  }

  .minions-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  
  .panel {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .count {
    font-family: var(--mc-font-numeric, sans-serif);
    font-weight: 400;
    text-align: center;
  }
`;
