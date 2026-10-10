import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .remember-choice {
    align-items: center;
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .remember-choice input {
    cursor: pointer;
  }
`;
