import {css} from 'lit-element';

export default css`
  .boost-cards {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: center;
    gap: 12px;
    width: 100%;
  }

  .boost-card {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .boost-icons {
    margin-bottom: 12px;
  }

  .boost-ability {
    margin-top: 16px;
  }

  .boost-total {
    margin-top: 16px;
    text-align: center;
    width: 100%;
  }

  .remember-choice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
  }

  .remember-choice input {
    cursor: pointer;
  }
`;
