import { css } from 'lit-element';

export default css`
  :host {
    display: block;
  }
  
  .list {
    text-align: left;
  }
  
  .title-menu {
    font-family: var(--mc-font-title, sans-serif);
    font-weight: bold;  
  }

  .trait-reference {
    font-family: var(--mc-font-trait, sans-serif);
  }
  
  .submenu {
    padding-left: 16px;
  }

  .option-image {
    display: block;
    width: 120px;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
  }
`;
