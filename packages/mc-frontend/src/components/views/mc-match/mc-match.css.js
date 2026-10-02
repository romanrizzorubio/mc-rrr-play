import { css } from 'lit-element';

export default css`
  :host {
    display: block;
    border: solid 1px gray;
    padding: 16px;
    margin: 0 auto;
    background-color: #E2E2E2;
  }

  .other-player-discards {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 16px;
    margin: 0 0 16px;
  }

  .other-player-discard {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .other-player-discard span {
    font-weight: 600;
  }
`;
