import { css } from 'lit-element';

export default css`
  :host {
    box-sizing: border-box;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    overflow: hidden;
    padding: 16px 0 0;
  }

  mc-match {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
  }
`;
