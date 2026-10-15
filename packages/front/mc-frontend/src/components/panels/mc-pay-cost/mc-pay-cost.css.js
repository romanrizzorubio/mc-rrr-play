import { css } from 'lit-element';

import base from '../../../styles/base.css.js';

export default css`
  ${base}
  :host {
    display: block;
    --pay-cost-divider: var(--divider); 
  }
  
  .divider {
    border-bottom: var(--pay-cost-divider);
  }

  h2,
  h4,
  h5 {
    font-family: var(--mc-font-title, sans-serif);
  }

  .cost-panel {
    display: flex;
    justify-content: space-between;
    padding-bottom: 0;
  }

  .cost-panel-divider {
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

  .payment-error {
    color: darkred;
    margin: 8px 0 0;
    text-align: left;
  }

  .resource-unit {
    background: transparent;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    display: inline-flex;
    padding: 2px;
  }

  .resource-unit[aria-pressed="false"] {
    opacity: .4;
  }

  .resource-unit:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .resource-selection-hint {
    margin: 8px 0 0;
    text-align: left;
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
