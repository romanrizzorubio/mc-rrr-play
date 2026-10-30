import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }
  .field,
  .button {
    width: 100%;
  }

  .button {
    margin-top: 16px;
  }

  .step-status {
    margin: 0 0 16px;
    font-weight: 600;
  }

  .max-players {
    display: block;
    width: min(100%, 320px);
    margin-top: 16px;
  }

  .step-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 16px;
  }

  .step-actions-next {
    justify-content: flex-end;
  }

  .step-actions .button {
    width: auto;
    min-width: 160px;
    margin-top: 0;
  }

  .expert-mode {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
  }

  .modular-sets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .modular-sets h3,
  .required-modular-sets h3 {
    font-family: var(--mc-font-title, sans-serif);
    margin: 0 0 8px;
    font-size: 1rem;
  }

  .required-modular-sets {
    margin-bottom: 16px;
  }

  .required-modular-set-names {
    margin: 0;
  }

  .modular-set-list {
    max-height: 240px;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
    border: 1px solid #d5d2dc;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
  }

  .modular-set-list button {
    display: flex;
    width: 100%;
    justify-content: space-between;
    gap: 8px;
    min-height: 48px;
    padding: 10px 16px;
    border: 0;
    background: #fff;
    color: inherit;
    text-align: left;
    cursor: pointer;
    font: inherit;
  }

  .modular-set-list button:hover,
  .modular-set-list button:focus-visible {
    background: #f2eff7;
  }

  .modular-set-list li + li {
    border-top: 1px solid #e4e0ea;
  }

  .empty-list {
    color: #666666;
  }

  @media (max-width: 600px) {
    .step-actions {
      align-items: stretch;
      flex-direction: column-reverse;
    }

    .step-actions .button {
      width: 100%;
    }

    .max-players {
      width: 100%;
    }

    .modular-sets {
      grid-template-columns: 1fr;
    }
  }
`;
