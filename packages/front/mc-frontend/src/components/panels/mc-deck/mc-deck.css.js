import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
    align-items: flex-start;
  }

  .deck-display {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .deck-piles {
    display: flex;
    align-items: flex-start;
  }

  .deck-name {
    max-width: 120px;
    margin-top: 4px;
    font-size: 0.8rem;
    line-height: 1.1;
    text-align: center;
  }

  .deck-name-top {
    margin: 0 0 4px;
    font-family: var(--mc-font-title, sans-serif);
    font-size: 0.85rem;
    font-weight: 700;
    line-height: 1.1;
    text-align: center;
    width: 100px;
  }

  .deck-name-spans-piles {
    align-self: stretch;
    max-width: none;
    width: auto;
  }

  .deck-panel-titled {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .panel:first-child {
    margin-right: 16px;
  }

  .count {
    display: flex;
    justify-content: center;
    width: fit-content;
    min-width: 1em;
    margin: 4px auto 0;
    padding: 2px 3px;
    border-radius: 3px;
    background-color: #212121;
    color: white;
    font-size: 0.85rem;
    font-family: var(--mc-font-numeric, sans-serif);
    font-weight: 600;
    line-height: 1;
    text-align: center;
  }

  .deck-panel {
    position: relative;
  }

  .known-cards-button {
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 1;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.94);
    color: #212121;
    cursor: pointer;
    font-size: 1.1rem;
  }

  .known-cards-button:focus-visible {
    outline: 2px solid #212121;
    outline-offset: 2px;
  }

  .known-cards-button mc-icon {
    display: inline-flex;
  }

  .discard-button {
    display: block;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: initial;
    cursor: pointer;
  }

  .discard-button:disabled {
    cursor: default;
  }

  .discard-button.playable mc-card-image {
    filter:
      drop-shadow(0 0 4px rgba(255, 235, 59, 0.95))
      drop-shadow(0 0 10px rgba(255, 235, 59, 0.7));
  }

  .discard-button.activation-blocked.playable mc-card-image {
    filter: none;
  }

  .deck-panel.play-card-blocked mc-card-image,
  .discard-button.play-card-blocked mc-card-image {
    filter: brightness(0.4);
  }

  .deck-panel.play-card-drop-target mc-card-image,
  .discard-button.play-card-drop-target mc-card-image {
    filter:
      drop-shadow(0 0 4px rgba(0, 200, 83, 0.95))
      drop-shadow(0 0 10px rgba(0, 200, 83, 0.7));
  }

  .deck-panel.play-card-drop-target,
  .discard-button.play-card-drop-target {
    border-radius: 8px;
    box-shadow: 0 0 0 3px rgba(0, 200, 83, 0.85);
  }

  .discard-button:focus-visible {
    outline: 2px solid #212121;
    outline-offset: 3px;
  }
`;
