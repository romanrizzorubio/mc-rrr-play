import {css} from 'lit-element';

export default css`
  .card-preview {
    display: flex;
    justify-content: center;
  }

  .boost-icons {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    margin-top: 12px;
    text-align: center;
  }

  .boost-icon-list {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  .defense-bonus-preview {
    margin: 12px auto 0;
    max-width: 36rem;
    text-align: left;
  }

  .defense-bonus-preview p {
    margin: 0;
  }

  .defense-bonus-preview p + p {
    margin-top: 8px;
  }

  .reasons {
    box-sizing: border-box;
    margin: 0 auto;
    max-width: 36rem;
    padding-left: 24px;
    text-align: left;
  }

  .reasons li + li {
    margin-top: 8px;
  }
`;
