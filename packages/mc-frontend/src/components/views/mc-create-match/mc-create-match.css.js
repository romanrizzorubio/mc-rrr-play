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

  .modular-sets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .modular-sets h3 {
    margin: 0 0 8px;
    font-size: 1rem;
  }

  .modular-set-list {
    max-height: 240px;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
    border: 1px solid #bdbdbd;
    border-radius: 4px;
  }

  .modular-set-list button {
    display: flex;
    width: 100%;
    justify-content: space-between;
    gap: 8px;
    padding: 8px;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .modular-set-list button:hover,
  .modular-set-list button:focus-visible {
    background: #eeeeee;
  }

  .modular-set-list li + li {
    border-top: 1px solid #e0e0e0;
  }

  .empty-list {
    color: #666666;
  }

  @media (max-width: 600px) {
    .modular-sets {
      grid-template-columns: 1fr;
    }
  }
`;
