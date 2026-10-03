import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .dialog {
    max-width: 1200px;
  }
  md-dialog.dialog.large {
    box-sizing: border-box;
    width: min(800px, calc(100vw - 48px));
    max-width: calc(100vw - 48px);
    max-height: min(780px, calc(100vh - 48px));
    min-height: 0;
  }
  div.dialog.large {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    max-height: min(700px, calc(100vh - 96px));
    min-height: 0;
    overflow: hidden;
  }
  div.dialog.large > .title,
  div.dialog.large > .actions {
    flex: 0 0 auto;
  }
  div.dialog.large > .content {
    box-sizing: border-box;
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
  }
  div.dialog.pay-cost > .content {
    padding-right: 16px;
  }
  
  .title {
    display: flex;
    justify-content: space-between;
    font-size: 24px;
  }
  
  .content {
    text-align: center;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
`;
