import {css} from 'lit-element';

export default css`
  :host {
    display: block;
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    color: #202124;
    --md-sys-color-primary: var(--mc-color-primary, #6750a4);
    --md-sys-color-on-primary: #ffffff;
    --md-sys-color-surface-container-low: #f7f5fb;
  }

  .room,
  .join-panel {
    margin-top: 20px;
    padding: 24px;
    border: 1px solid #e4e0ea;
    border-radius: 24px;
    background: var(--md-sys-color-surface-container-low);
    box-shadow: 0 2px 6px rgb(0 0 0 / 8%), 0 8px 20px rgb(0 0 0 / 5%);
  }

  .room-heading,
  .room-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .room-actions {
    margin-top: 20px;
  }

  .room-heading h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 500;
  }

  .room-status {
    font-size: 1.25rem;
    font-family: var(--mc-font-title, sans-serif);
    font-weight: 700;
  }

  .room-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin: 16px 0;
  }

  .room-meta p {
    margin: 0;
    padding: 14px 16px;
    border-radius: 16px;
    background: #efedf4;
    line-height: 1.5;
  }

  .players {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .players li {
    padding: 14px 16px;
    border: 1px solid #e4e0ea;
    border-radius: 16px;
    background: #fff;
  }

  .players strong,
  .players span {
    display: block;
  }

  .players .player-name {
    margin-bottom: 4px;
    font-family: var(--mc-font-title, sans-serif);
    font-weight: 700;
  }

  .players .player-aspect {
    display: inline;
    font-weight: 400;
  }

  .player-aspect.aspect-aggression {
    color: #c62828;
  }

  .player-aspect.aspect-justice {
    color: #8a6d00;
  }

  .player-aspect.aspect-protection {
    color: #2e7d32;
  }

  .player-aspect.aspect-leadership {
    color: #1565c0;
  }

  .player-aspect.aspect-pool {
    color: #ad1457;
  }

  .player-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
  }

  .players .player-detail-separator {
    display: inline-block;
    margin: 0 6px;
    font-family: var(--mc-font-trait-separator, sans-serif);
  }

  .room md-filled-button,
  .join-panel md-filled-button {
    --md-filled-button-container-shape: 100px;
    --md-filled-button-container-color: var(--mc-color-primary, #6750a4);
    --md-filled-button-label-text-color: #ffffff;
  }

  .room md-text-button {
    --md-text-button-label-text-color: #b3261e;
  }

  .error,
  .notice {
    padding: 12px 16px;
    border-radius: 12px;
  }

  .error {
    background: #fce8e6;
    color: #8d1c16;
  }

  .notice {
    background: #e5f3e8;
    color: #174b2b;
  }

  @media (max-width: 600px) {
    :host {
      padding: 16px 12px;
    }

    .room-heading,
    .room-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .room,
    .join-panel {
      padding: 20px;
      border-radius: 20px;
    }

  }
`;
