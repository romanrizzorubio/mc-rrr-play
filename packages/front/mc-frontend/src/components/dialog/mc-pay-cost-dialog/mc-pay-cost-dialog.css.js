import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .title {
    align-items: center;
    font-family: var(--mc-font-title, sans-serif);
  }

  .paying-card-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: var(--mc-font-title, sans-serif);
  }
  
  .cost,
  .paid {
    text-align: left;
  }
`;
