import {css} from 'lit-element';

export default css`
  .card-list {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
  }

  .card-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 8px 12px;
  }

  .card-list li + li {
    border-top: 1px solid #e0e0e0;
  }
`;
