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
    flex-wrap: wrap;
    gap: 1rem;
  }

  .assigned-slider {
    box-sizing: border-box;
    width: 100%;
  }

  .assigned-slider md-slider {
    box-sizing: border-box;
    display: block;
    min-inline-size: 0;
    width: 100%;
  }
`;
