import { css } from 'lit-element';

export default css`
  :host {
    display: inline;
    position: relative;
  }
  
  .wild:after {
    content: 'w';
    font-family: 'champions_iconsregular';
    color: green;
    font-size: 0.5em;
    position: relative;
    bottom: -0.5em;
    right: 1em;
  }
`;
