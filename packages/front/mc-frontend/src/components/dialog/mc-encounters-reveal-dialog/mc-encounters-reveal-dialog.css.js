import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .card-preview {
    display: flex;
    justify-content: center;
  }

  .boost-icons {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-bottom: 12px;
  }

  .boost-icon-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 4px;
    text-align: center;
  }

  .boost-amplification-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
  }

  .boost-icon-list {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    vertical-align: middle;
  }

  .boost-ability {
    margin-top: 16px;
  }

`;
