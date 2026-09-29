import { css, unsafeCSS } from 'lit-element';

export default css`
  :host {
    display: flex;
    justify-content: center;
  }

  .panel {
    position: absolute;
    width: 100%;
    left: 0;
    padding: 16px;
    background-color: #4D4C4C;
  }

  .panel.show {
    bottom: 0;
  }

  .panel.hide {
    bottom: -150px;
  }
`;
