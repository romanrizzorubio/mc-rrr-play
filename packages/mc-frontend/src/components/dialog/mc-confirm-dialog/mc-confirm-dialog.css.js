import {css} from 'lit-element';

export default css`
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
