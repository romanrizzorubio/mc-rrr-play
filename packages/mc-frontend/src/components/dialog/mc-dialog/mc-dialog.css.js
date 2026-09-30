import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .dialog {
    max-width: 1200px;
  }
  .dialog.large {
    width: 800px;
    min-height: 630px;
  }
  
  .title {
    display: flex;
    justify-content: space-between;
    font-size: 24px;
  }
  
  .content {
    text-align: center;
  }
`;
