import { css } from 'lit-element';

export default css`
  :host {
    --card-size-xs: 25px;
    --card-size-s: 50px;
    --card-size-m: 100px;
    --card-size-l: 200px;
    --card-size-xl: 300px;
    --card-short: var(--card-size-m);
    --card-large: calc(var(--card-short) * 1.39667);
    
    display: block;
  }

  :host([size="xs"]) {
    --card-short: var(--card-size-xs);
  }

  :host([size="s"]) {
    --card-short: var(--card-size-s);
  }

  :host([size="m"]) {
    --card-short: var(--card-size-m);
  }

  :host([size="l"]) {
    --card-short: var(--card-size-l);
  }

  :host([size="xl"]) {
    --card-short: var(--card-size-xl);
  }

  :host([rotated]) {
    position: relative;
    width: var(--card-short);
    height: var(--card-large);
  }

  .size-xs {
    --card-short: var(--card-size-xs);
  }
  .size-s {
    --card-short: var(--card-size-s);
  }
  .size-m {
    --card-short: var(--card-size-m);
  }
  .size-l {
    --card-short: var(--card-size-l);
  }
  .size-xl {
    --card-short: var(--card-size-xl);
  }

  .size-xs,.size-s,.size-m,.size-l,.size-xl {
    --card-large: calc(var(--card-short) * 1.39667);
  }
  
  .vertical {
    width: var(--card-short);
    height: var(--card-large);
  }
  :host(.empty-discard) .vertical {
    aspect-ratio: 744 / 1038;
    height: auto;
  }
  .horizontal {
    width: var(--card-large);
    height: var(--card-short);
  }

  .rotated {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-90deg);
    transform-origin: center;
  }
  
  
`;
