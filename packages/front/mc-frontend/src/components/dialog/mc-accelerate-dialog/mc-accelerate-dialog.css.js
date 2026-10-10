import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .accelerate-value {
    font-size: 2em;
    margin-top: 16px;
  }
  .accelerate-base {
    font-size: 1.5em;
    margin-top: 16px;
  }
  .accelerate-modify {
    display: flex;
    font-size: 1.5em;
    width: 100%;
    justify-content: space-around;
    margin-top: 16px;
  }
  .accelerate-icons,
  .accelerate-tokens {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3em;
  }
  .accelerate-modify mc-icon {
    font-size: 2em;
    display: block;
    margin-top: 16px;
  }
`;
