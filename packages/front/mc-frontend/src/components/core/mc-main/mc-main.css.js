import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  :host(.match-main) {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }

  :host(.match-main) slot {
    display: contents;
  }

  :host(.match-main) ::slotted([route~="match"]) {
    box-sizing: border-box;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
  }
`;
