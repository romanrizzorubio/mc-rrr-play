import { css } from 'lit-element';

export default css`
  :host {
    display: block;
    position: relative;
    flex: 0 0 auto;
    z-index: 20;
    width: calc(100% + 32px);
    margin: 0 -16px;
    box-sizing: border-box;
    padding: 16px 0 0;
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

  .panel-chevron {
    display: inline-block;
    width: 0.55rem;
    height: 0.55rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg);
  }

  .panel-chevron.open {
    transform: rotate(225deg);
  }

  .panel.hide mc-card-list {
    display: none;
  }

  mc-card-list[inert] {
    pointer-events: none;
  }
`;
