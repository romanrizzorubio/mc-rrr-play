import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  mc-card.marked {
    border: solid 3px #111;
    border-radius: 12px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
  }

  .ability-name {
    text-align: center;
  }

  .unplayable {
    --disabled-card-brightness: 0.5;
  }

  mc-card.disabled {
    pointer-events: none;
  }
  
  :not(.marked) {
    border: solid 3px transparent;
  }
`;
