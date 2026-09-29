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
  
  :not(.marked) {
    border: solid 3px transparent;
  }
`;
