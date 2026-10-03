import { css } from 'lit-element';

import base from '../../../../static/styles/base.css.js';

export default css`
  ${base}
  :host {
    display: block;
    --pay-cost-divider: var(--divider); 
  }
  
  .divider {
    border-bottom: var(--pay-cost-divider);
  }

  .cost-panel {
    display: flex;
    justify-content: space-between;
    padding-bottom: 16px;
  }

  .cost-panel>:nth-child(1) {
    text-align: left;
    width: 25%;
  }

  .cost-panel>:nth-child(2) {
    text-align: center;
    width: 50%;
  }

  .cost-panel>:nth-child(3) {
    text-align: right;
    width: 25%;
  }

  .panel {
  }

  .panel .subpanels {
    display: flex;
    gap: 8px;
  }

  .subpanel {
    flex: 1 1 0;
    min-width: 0;
    padding-bottom: var(--margin);
  }
  
  mc-card-list {
    height: var(--card-large-s);
  }
`;
