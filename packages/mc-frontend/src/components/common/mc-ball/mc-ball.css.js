import { css, unsafeCSS } from 'lit-element';

export default css`
  :host {
    display: inline;
  }

  .ball {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    display: inline-block;
  }
  
  .ok {
    background-color: green;
  }
  
  .ko {
    background-color: red;
  }

`;
