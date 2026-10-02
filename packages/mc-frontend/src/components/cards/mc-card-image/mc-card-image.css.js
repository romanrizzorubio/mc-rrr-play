import { css } from 'lit-element';

export default css`
  :host {
    --card-size-xs: 25px;
    --card-size-s: 50px;
    --card-size-m: 100px;
    --card-size-l: 200px;
    --card-size-xl: 300px;
    
    display: block;
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

  .size-s,.size-m,.size-l,.size-xl {
    --card-large: cal(var(--card-short)*1.36);
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
  
  
`;
