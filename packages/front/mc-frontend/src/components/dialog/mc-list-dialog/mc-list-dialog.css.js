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
  
  .submenu {
    padding-left: 16px;
  }
`;
