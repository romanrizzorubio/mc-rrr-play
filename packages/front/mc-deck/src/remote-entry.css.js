import {css} from 'lit-element';

export default css`
  :host {
    display: block;
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 24px;
    box-sizing: border-box;
  }

  p {
    margin-top: 0;
  }

  .hero-selection {
    margin-top: 24px;
    padding: 20px;
    border: 1px solid #bdbdbd;
    border-radius: 8px;
  }

  .hero-selection h2 {
    font-family: var(--mc-font-title, sans-serif);
    margin-top: 0;
  }

  .hero-selection-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  @media (max-width: 700px) {
    :host {
      padding: 12px;
    }

    .hero-selection {
      padding: 16px;
    }
  }
`;
