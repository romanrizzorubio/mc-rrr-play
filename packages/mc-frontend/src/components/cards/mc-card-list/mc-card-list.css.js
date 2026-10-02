import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .marked {
    border: solid 3px yellow;
  }

  .ability-name {
    text-align: center;
  }

  .unplayable {
    filter: brightness(0.5);
  }
  
  :not(.marked) {
    border: solid 3px transparent;
  }
`;
