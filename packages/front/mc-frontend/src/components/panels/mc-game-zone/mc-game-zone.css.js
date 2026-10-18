import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
    flex-direction: column;
  }

  .play-card-drop-zone {
    min-height: 100%;
    border-radius: 8px;
    transition: box-shadow 120ms ease, background-color 120ms ease;
  }

  .play-card-drop-zone.available {
    background-color: rgba(0, 200, 83, 0.08);
    box-shadow:
      0 0 0 3px rgba(0, 200, 83, 0.85),
      0 0 16px rgba(0, 200, 83, 0.6);
  }
  
  .panel:first-child {
    margin-right: 16px;
  }

  .count {
    font-family: var(--mc-font-numeric, sans-serif);
    text-align: center;
  }
  
  .upgrades-supports {
    display: flex;
    flex-wrap: wrap;
  }
`;
