import { css, unsafeCSS } from 'lit-element';

export default css`
  :host {
    --card-size: 100px;

    display: block;
    position: relative;
  }
  
  .cards-facedown {
    display: flex;
    justify-content: center;
  }
  .facedown-count {
    text-align: center;
  }

  .vertical {
    width: var(--card-size);
  }

  .horizontal {
    height: var(--card-size);
  }

  header {
    display: flex;
    justify-content: space-between;
  }

  .header-left {
    text-align: left;
  }

  .name {
    text-align: center;
  }

  .header-right {
    text-align: right;
  }

  .exhausted {
    transform: rotate(15deg);
    bottom: 7px;
  }

  .counters,
  .status {
    display: flex;
    justify-content: space-between;
    text-align: center;
  }

  .generic {
    background-color: green;
    color: white;
    width: 100%;
  }

  .damage {
    background-color: red;
    width: 100%;
  }

  .acceleration {
    background-color: black;
    color: white;
    width: 100%;
  }
  .threat {
    background-color: yellow;
    width: 100%;
  }

  .tough {
    background-color: #e16f1c;
    color: white;
    width: 100%;
  }

  .stunned {
    background-color: #48C548;
    width: 100%;
  }

  .confused {
    background-color: #7a0888;
    color: white;
    width: 100%;
  }
  
  .dialog {
    min-height: 600px;
  }
  
  .attached {
    display: flex;
    justify-content: flex-start;
  }
`;
