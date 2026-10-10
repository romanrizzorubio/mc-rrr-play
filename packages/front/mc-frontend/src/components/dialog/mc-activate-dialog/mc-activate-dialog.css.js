import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .activate .content {
    box-sizing: border-box;
    display: flex;
    font-size: 2em;
    width: 100%;
    justify-content: space-around;
    padding: 0 16px;
  }

  .activation-skipped {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    margin: 0;
    font-size: 1rem;
    text-align: center;
  }

  .activation-status-image {
    display: block;
    width: 120px;
    max-width: 100%;
    height: auto;
  }

  .activation-skipped p {
    margin: 0;
  }
`;
