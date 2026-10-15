import { css } from 'lit-element';

export default css`
  :host {
    display: inline;
  }

  .mc-icon {
    font-family: 'champions_iconsregular';
  }

  .mc-icon-svg {
    display: inline-block;
    width: 1em;
    height: 1em;
    vertical-align: -0.15em;
  }

  .mc-icon.disabled {
    color: #858585;
  }

  .m {
    color: #0c0c98;
  }

  .p {
    color: darkred;
  }

  .e {
    color: #d3d300;
  }

  .w {
    color: green;
  }

`;
