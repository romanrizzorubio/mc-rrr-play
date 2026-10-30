import { css } from 'lit-element';

export default css`
  :host {
    display: block;
    position: fixed;
    inset: auto 0 0;
    z-index: 20;
    isolation: isolate;
  }

  .panel {
    position: relative;
    width: 100%;
    max-height: calc(100dvh - 64px);
    overflow-y: auto;
    padding: 16px;
    box-sizing: border-box;
    background-color: #4D4C4C;
  }

  md-elevated-button {
    margin-bottom: 8px;
  }

  .panel.hide mc-card-list {
    display: none;
  }

  mc-card-list[inert] {
    pointer-events: none;
  }
`;
