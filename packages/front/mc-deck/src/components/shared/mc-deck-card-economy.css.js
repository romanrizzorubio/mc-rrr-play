import {css} from 'lit-element';

export default css`
  :host {
    display: block;
  }

  .economy,
  .cost,
  .resource-summary,
  .resource-icons {
    display: flex;
    align-items: center;
  }

  .economy {
    flex-wrap: wrap;
    gap: 8px;
    font-size: 0.9em;
  }

  .cost,
  .resource-summary {
    gap: 5px;
  }

  .label {
    color: #616161;
  }

  .resource-icons {
    gap: 3px;
  }

  .mc-icon {
    font-family: 'champions_iconsregular';
    font-size: 1.25em;
    line-height: 1;
  }

  .mc-icon.m {
    color: #0c0c98;
  }

  .mc-icon.p {
    color: darkred;
  }

  .mc-icon.e {
    color: #d3d300;
  }

  .mc-icon.w {
    color: green;
  }
`;
