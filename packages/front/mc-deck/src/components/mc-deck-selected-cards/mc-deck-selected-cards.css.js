import {css} from 'lit-element';

export default css`
  :host {
    display: block;
    min-width: 0;
  }

  h3,
  p {
    margin-top: 0;
  }

  h3,
  h4,
  .card-name {
    font-family: var(--mc-font-title, sans-serif);
  }

  .card-group {
    min-width: 0;
  }

  .card-groups {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 20px;
    align-items: start;
  }

  .card-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .secondary-card-columns {
    display: contents;
  }

  h4 {
    margin: 0 0 8px;
  }

  .selected-card img {
    width: 40px;
    height: 56px;
    object-fit: contain;
  }

  .selected-card {
    cursor: pointer;
  }

  .selected-card.card-basic {
    background-color: #f2f2f2;
  }

  .selected-card.aspect-aggression {
    background-color: #fff0ef;
  }

  .selected-card.aspect-justice {
    background-color: #fffbea;
  }

  .selected-card.aspect-protection {
    background-color: #eff8ef;
  }

  .selected-card.aspect-leadership {
    background-color: #eef5ff;
  }

  .selected-card.aspect-pool {
    background-color: #fff0f6;
  }

  .selected-card:focus-visible {
    outline: 2px solid #6750a4;
    outline-offset: -2px;
  }

  .card-image-button {
    flex: 0 0 auto;
    padding: 0;
    border: 0;
    background: none;
    cursor: zoom-in;
  }

  .card-info {
    display: grid;
    flex: 1;
    gap: 4px;
    min-width: 0;
  }

  .card-info span {
    color: #616161;
    font-size: 0.9em;
  }

  .selected-card-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .copy-count {
    width: 64px;
    min-height: 40px;
    padding: 4px 6px;
    border: 1px solid #777;
    border-radius: 4px;
    font: inherit;
  }

  .copy-count:focus {
    outline: 2px solid #6750a4;
    outline-offset: 1px;
  }

  .fixed-count {
    white-space: nowrap;
  }

  @media (max-width: 1000px) {
    .card-groups {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .secondary-card-columns {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }
  }

  @media (max-width: 700px) {
    .card-groups {
      grid-template-columns: 1fr;
    }

    .secondary-card-columns {
      display: contents;
    }
  }
`;
