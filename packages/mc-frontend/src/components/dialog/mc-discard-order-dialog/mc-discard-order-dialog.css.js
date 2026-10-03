import {css} from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .card-names {
    display: flex;
    flex-direction: column;
    gap: 8px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .card-names button {
    box-sizing: border-box;
    cursor: pointer;
    font: inherit;
    padding: 8px 12px;
    width: 100%;
  }
`;
