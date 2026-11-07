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
    padding: 0 16px;
    width: 100%;
    background-color: transparent;
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
    box-sizing: border-box;
    display: block;
    flex: 1 1 0;
    min-height: 0;
    min-width: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1px solid #e4e0ea;
    padding: 16px 16px 0;
    background-color: #f7f5fb;
  }

  .match-board {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .player-board-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 240px;
    align-items: end;
    gap: 16px;
    margin-top: auto;
    padding: 16px 0;
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

  .player-board-row.players-collapsed {
    grid-template-columns: minmax(0, 1fr) auto;
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

  .player-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .player-sidebar-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 36px;
    padding: 6px 8px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: 600;
    line-height: 1.2;
    cursor: pointer;
  }

  .player-sidebar-toggle:hover {
    background: #ece8f4;
  }

  .player-sidebar-toggle:focus-visible {
    outline: 2px solid var(--mc-color-primary, #6750a4);
    outline-offset: 2px;
  }

  .player-sidebar-chevron {
    display: inline-block;
    flex: 0 0 auto;
    width: 0.55rem;
    height: 0.55rem;
    align-self: center;
    vertical-align: middle;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg);
  }

  .player-sidebar-chevron.open {
    transform: rotate(225deg);
  }

  .player-sidebar-content {
    display: grid;
    gap: 10px;
    min-width: 0;
  }

  .player-sidebar-content[hidden] {
    display: none;
  }

  .player-sidebar.collapsed {
    display: flex;
    width: max-content;
    max-width: 100%;
    max-height: none;
    overflow: visible;
    padding: 4px 8px;
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

    .player-board-row.players-collapsed {
      grid-template-columns: minmax(0, 1fr);
    }

    .player-sidebar {
      position: static;
      max-height: 320px;
    }

    .player-sidebar.collapsed {
      justify-self: end;
    }
  }
`;
