import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
    flex-direction: column;
  }
  
  .panel:first-child {
    margin-right: 16px;
  }

  .count {
    font-family: var(--mc-font-numeric, sans-serif);
    text-align: center;
  }
  
  .upgrades-supports {
    display: flex;
    flex-wrap: wrap;
  }
`;
