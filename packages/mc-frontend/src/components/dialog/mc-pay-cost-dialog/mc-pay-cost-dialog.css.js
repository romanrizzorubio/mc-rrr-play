import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .title {
    align-items: center;
  }

  .paying-card-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .cost,
  .paid {
    text-align: left;
  }
`;
