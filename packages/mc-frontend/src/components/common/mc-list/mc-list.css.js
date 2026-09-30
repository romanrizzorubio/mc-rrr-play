import { css } from 'lit-element';

export default css`
  :host {
    display: inline;
  }

  md-list-item {
    text-align: left;
  }
  
  md-list-item header {
    display: inline;
  }

  md-list-item header:after {
    content: ':';
  }
`;
