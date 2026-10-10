import {css} from 'lit-element';

export default css`
  :host {
    display: block;
  }

  nav {
    max-width: 1200px;
    margin: 0 auto 24px;
    padding: 0 24px;
  }

  md-tabs {
    width: 100%;
  }

  @media (max-width: 700px) {
    nav {
      padding: 0 12px;
    }
  }
`;
