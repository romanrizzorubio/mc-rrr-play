import { css } from 'lit-element';

export default css`
  :host {
    --large-multiply: 1.36;
    --card-size-s: 50px;
    --card-size-m: 100px;
    --card-size-l: 200px;
    --card-large-s: 68px;
    --card-large-m: cal(var(--card-size-m)*var(--large-multiply));
    --card-large-l: cal(var(--card-size-l)*var(--large-multiply));
    --divider: 1px solid gray;
    --margin: 16px;
  }
`;
