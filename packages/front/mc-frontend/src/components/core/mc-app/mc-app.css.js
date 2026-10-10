import { css } from 'lit-element';

export default css`
  :host {
    display: block;
    border: solid 1px gray;
    padding: 16px;
    margin: 0 auto;
  }
  
  h1 {
    font-family: var(--mc-font-title, sans-serif);
    text-align: center;
  }
`;
