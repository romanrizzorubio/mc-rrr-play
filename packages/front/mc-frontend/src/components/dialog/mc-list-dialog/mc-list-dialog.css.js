import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }
  
  .list {
    text-align: left;
  }

  .content > mc-card + .list {
    margin-top: 16px;
  }

  .context-cards,
  .content > mc-card + .context-cards {
    margin-top: 16px;
  }

  .context-cards + .list {
    margin-top: 16px;
  }

  .context-cards {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .context-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .context-card-label {
    max-width: 160px;
    font-family: var(--mc-font-title, sans-serif);
  }

  .context-card-separator {
    align-self: stretch;
    min-height: 100px;
    border-left: 1px solid currentColor;
    opacity: 0.5;
  }
  
  .title-menu {
    font-family: var(--mc-font-title, sans-serif);
    font-weight: bold;  
  }

  .trait-reference {
    font-family: var(--mc-font-trait, sans-serif);
  }
  
  .submenu {
    padding-left: 16px;
  }

  .option-image {
    display: block;
    flex: 0 0 auto;
    width: 64px;
    max-width: 100%;
    height: 90px;
    border-radius: 4px;
    object-fit: cover;
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .option-text {
    min-width: 0;
  }
`;
