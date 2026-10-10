import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }
  
  .title {
    font-family: var(--mc-font-title, sans-serif);
    font-size: 1em;
    margin: 16px 0;
  }
  
  .panel {
    border: solid 1px gray;
    padding: 16px;
  }
`;
