import {css} from 'lit-element';

export default css`
  .card-groups {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 16px;
    overflow-x: auto;
  }

  .card-group {
    box-sizing: border-box;
    flex: 1 0 240px;
  }

  .card-group + .card-group {
    border-inline-start: 1px solid var(--md-sys-color-outline-variant, rgba(0, 0, 0, 0.2));
    padding-inline-start: 16px;
  }

  .card-group-title {
    font-family: var(--mc-font-title, sans-serif);
    font-size: 1.1rem;
    margin: 0 0 8px;
    text-align: center;
  }
`;
