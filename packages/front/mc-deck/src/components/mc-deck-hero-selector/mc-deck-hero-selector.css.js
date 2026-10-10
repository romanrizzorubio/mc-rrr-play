import {css} from 'lit-element';

export default css`
  :host {
    display: block;
    margin: 16px 0;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }

  .hero-option {
    width: 100%;
    min-width: 0;
    min-height: 248px;
    white-space: normal;
    --md-elevated-button-container-shape: 12px;
  }

  .hero-option.selected {
    outline: 2px solid #6750a4;
    outline-offset: 2px;
  }

  .hero-choice {
    display: grid;
    justify-items: center;
    gap: 12px;
    width: 100%;
    white-space: normal;
  }

  .hero-image {
    display: block;
    width: 100%;
    max-width: 136px;
    aspect-ratio: 2 / 3;
    border-radius: 6px;
    object-fit: contain;
  }

  .hero-name {
    display: block;
    font-family: var(--mc-font-title, sans-serif);
    line-height: 1.25;
    text-align: center;
    white-space: normal;
    font-weight: 600;
  }

  @media (max-width: 480px) {
    .hero-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .hero-option {
      min-height: 220px;
    }

    .hero-image {
      max-width: 112px;
    }
  }
`;
