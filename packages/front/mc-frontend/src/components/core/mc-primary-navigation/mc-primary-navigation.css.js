import {css} from 'lit-element';

export default css`
  :host {
    display: block;
  }

  nav {
    box-sizing: border-box;
    width: 100%;
    margin: 0 0 24px;
    padding: 0 24px;
  }

  md-tabs {
    width: 100%;
  }

  .unselected-tabs {
    box-sizing: border-box;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    width: 100%;
    overflow-x: auto;
    border-bottom: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
  }

  .unselected-tabs md-secondary-tab {
    flex: 1;
  }

  @media (max-width: 700px) {
    nav {
      padding: 0 12px;
    }
  }
`;
