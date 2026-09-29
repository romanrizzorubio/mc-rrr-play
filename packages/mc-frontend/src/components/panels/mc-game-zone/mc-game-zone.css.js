import { css, unsafeCSS } from 'lit-element';

export default css`
  :host {
    display: flex;
    flex-direction: column;
  }
  
  .panel:first-child {
    margin-right: 16px;
  }

  .count {
    text-align: center;
  }
  
  .upgrades-supports {
    display: flex;
    flex-wrap: wrap;
  }
`;
