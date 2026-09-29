import { css, unsafeCSS } from 'lit-element';

export default css`
  :host {
    display: flex;
    flex-direction: column;
  }

  md-filled-text-field {
    margin-bottom: 16px;
  }

  md-filled-button {
    margin-top: 16px;
  }
  
  label {
    text-align: right;
    line-height: 2em;
  }
`;
