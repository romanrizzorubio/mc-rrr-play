import {css} from 'lit-element';

export default css`
  mc-card-list {
    max-height: 65vh;
    overflow-y: auto;
    align-content: flex-start;
  }

  .revealed-cards-with-info {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-content: flex-start;
    gap: 8px;
    max-height: 65vh;
    overflow-y: auto;
  }

  .revealed-card-with-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .revealed-card-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;
