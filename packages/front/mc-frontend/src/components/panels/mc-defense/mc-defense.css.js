import { css } from 'lit-element';

import base from '../../../styles/base.css.js';

export default css`
  ${base}
  :host {
    display: block;
    --pay-cost-divider: var(--divider);
  }

  h3 {
    font-family: var(--mc-font-title, sans-serif);
  }

  .defense-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: 24px;
  }

  .defense-layout.with-requests {
    grid-template-columns: minmax(0, 1fr) 220px;
  }

  .defense-main {
    min-width: 0;
  }

  .defense-requests {
    display: grid;
    gap: 8px;
  }

  .defense-requests h3 {
    margin: 0 0 4px;
  }

  .defense-player {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px;
    border: 1px solid #e4e0ea;
    border-radius: 16px;
    background: #fff;
    color: inherit;
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }

  .defense-player:hover {
    background: #f7f5fb;
  }

  .defense-player:focus-visible {
    outline: 2px solid var(--mc-color-primary, #6750a4);
    outline-offset: 2px;
  }

  .hero-thumbnail {
    flex: 0 0 auto;
    width: 42px;
    height: 58px;
    border-radius: 3px;
    object-fit: cover;
  }

  .player-name {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  @media (max-width: 600px) {
    .defense-layout.with-requests {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  
  .divider {
    border-bottom: var(--pay-cost-divider);
  }

  .cost-panel {
    display: flex;
    justify-content: space-between;
    padding-bottom: 16px;
  }

  .cost-panel :nth-child(1) {
    text-align: left;
    width: 25%;
  }

  .cost-panel :nth-child(2) {
    text-align: center;
    width: 50%;
  }

  .cost-panel :nth-child(3) {
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
`;
