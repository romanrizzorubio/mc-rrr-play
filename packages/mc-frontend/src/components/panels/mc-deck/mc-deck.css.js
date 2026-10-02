import { css } from 'lit-element';

export default css`
  :host {
    display: flex;
  }
  
  .panel:first-child {
    margin-right: 16px;
  }

  .count {
    display: flex;
    justify-content: center;
    width: fit-content;
    min-width: 1em;
    margin: 4px auto 0;
    padding: 2px 3px;
    border-radius: 3px;
    background-color: #212121;
    color: white;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1;
    text-align: center;
  }

  .discard-button {
    display: block;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: initial;
    cursor: pointer;
  }

  .discard-button:disabled {
    cursor: default;
  }

  .discard-button:focus-visible {
    outline: 2px solid #212121;
    outline-offset: 3px;
  }
`;
