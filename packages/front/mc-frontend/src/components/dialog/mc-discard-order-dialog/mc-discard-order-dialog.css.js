import {css} from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .order-instructions {
    margin: 0 0 12px;
    text-align: center;
  }

  .card-zones {
    display: flex;
    align-items: stretch;
    gap: 16px;
    max-height: 65vh;
    overflow-y: auto;
  }

  .card-zone {
    min-width: 0;
    padding: 12px;
    border: 1px solid var(--md-sys-color-outline-variant, #797979);
    border-radius: 8px;
  }

  .order-zone {
    flex: 1 1 65%;
  }

  .discard-zone {
    flex: 0 1 35%;
    min-width: 180px;
    border-style: dashed;
  }

  .card-zone h3 {
    margin: 0 0 12px;
    text-align: center;
  }

  .ordered-cards {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
    min-height: 96px;
  }

  .discard-cards {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
    min-height: 96px;
  }

  .discard-placeholder {
    align-self: center;
    color: var(--md-sys-color-on-surface-variant, #49454f);
    padding: 12px;
    text-align: center;
  }

  .ordered-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: grab;
    touch-action: none;
  }

  .ordered-card:active {
    cursor: grabbing;
  }

  .ordered-card.dragging {
    opacity: 0.45;
  }

  .remember-choice {
    align-items: center;
    display: flex;
    gap: 8px;
    margin-top: 16px;
  }

  .remember-choice input {
    cursor: pointer;
  }

  @media (max-width: 700px) {
    .card-zones {
      flex-direction: column;
    }

    .discard-zone {
      min-width: 0;
    }
  }
`;
