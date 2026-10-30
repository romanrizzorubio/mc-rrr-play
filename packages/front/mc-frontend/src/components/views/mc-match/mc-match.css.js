import { css } from 'lit-element';

export default css`
  :host {
    display: block;
    border: solid 1px #e4e0ea;
    padding: 16px;
    margin: 0 auto;
    background-color: #f7f5fb;
    --md-sys-color-primary: var(--mc-color-primary, #6750a4);
    --md-sys-color-on-primary: #ffffff;
    --md-sys-color-surface-container-low: #f7f5fb;
  }

  .match-board {
    min-width: 0;
    position: relative;
    isolation: isolate;
  }

  .match-layout {
    display: block;
  }

  .player-board-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 240px;
    align-items: end;
    gap: 16px;
    margin-top: 16px;
  }

  .board-player-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    font-size: 1.1rem;
  }

  .player-board-row.single-player {
    grid-template-columns: minmax(0, 1fr);
  }

  .player-sidebar {
    position: static;
    display: grid;
    gap: 10px;
    max-height: calc(100vh - 24px);
    overflow-y: auto;
    padding: 12px;
    border: 1px solid #e4e0ea;
    border-radius: 20px;
    background: #f7f5fb;
    box-shadow: 0 2px 6px rgb(0 0 0 / 8%);
  }

  .player-sidebar h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  .player-accordion {
    border: 1px solid #e4e0ea;
    border-radius: 16px;
    background: #fff;
    overflow: hidden;
  }

  .player-board {
    min-width: 0;
  }

  .local-player-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border: 2px solid transparent;
    border-radius: 16px;
  }

  .player-name {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .player-accordion summary {
    flex-wrap: nowrap;
  }

  .player-accordion.play-card-drop-target {
    border-color: #2e7d32;
    box-shadow: 0 0 0 2px rgb(46 125 50 / 22%);
  }

  .player-accordion.play-card-drop-target summary {
    background: #e8f5e9;
  }

  .player-accordion summary {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 56px;
    padding: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .hero-thumbnail {
    flex: 0 0 auto;
    width: 42px;
    height: 58px;
    border-radius: 3px;
    object-fit: cover;
  }

  .first-player-token {
    width: 32px;
    height: 32px;
    margin-left: auto;
  }

  .player-accordion .first-player-token {
    flex: 0 0 auto;
    margin: 0;
  }

  md-filled-button.request-action,
  .action-request md-filled-button,
  .action-request md-text-button {
    min-height: 36px;
    margin: 6px;
    --md-filled-button-container-shape: 100px;
    --md-filled-button-container-color: var(--mc-color-primary, #6750a4);
    --md-filled-button-label-text-color: #ffffff;
  }

  .player-sidebar > md-text-button.request-action,
  .player-list-entry > md-text-button.request-action {
    --md-text-button-label-text-color: var(--mc-color-primary, #6750a4);
  }

  .action-request {
    padding: 8px;
    border: 1px solid #c8d8e8;
    border-radius: 16px;
    background: #eaf2fa;
  }

  .action-request p,
  .action-request-status {
    margin: 0;
  }

  .action-request-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .action-request .secondary {
    --md-text-button-label-text-color: var(--mc-color-primary, #6750a4);
  }

  mc-scenario.read-only,
  mc-player.read-only {
    pointer-events: none;
  }

  .deck-target-veil {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: rgba(0, 0, 0, 0.58);
    cursor: not-allowed;
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

  @media (max-width: 900px) {
    .player-board-row {
      grid-template-columns: minmax(0, 1fr) 200px;
      gap: 10px;
    }

    .player-sidebar {
      padding: 8px;
    }
  }

  @media (max-width: 680px) {
    .player-board-row {
      grid-template-columns: minmax(0, 1fr);
    }

    .player-sidebar {
      position: static;
      max-height: 320px;
    }
  }
`;
