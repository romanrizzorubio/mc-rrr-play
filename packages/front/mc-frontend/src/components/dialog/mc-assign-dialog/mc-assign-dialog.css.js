import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  h2 {
    font-family: var(--mc-font-title, sans-serif);
  }
  
  .cards {
    display: flex;
    justify-content: center;
  }
`;
