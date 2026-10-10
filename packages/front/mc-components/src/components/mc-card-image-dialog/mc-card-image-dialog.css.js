import {css} from 'lit-element';

export default css`
  :host {
    display: contents;
  }

  md-dialog {
    max-width: min(92vw, 440px);
    min-height: 0;
    max-height: calc(100vh - 48px);
    max-height: calc(100dvh - 48px);
  }

  md-dialog.large {
    max-width: min(92vw, 560px);
    min-height: 0;
  }

  .content {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 8px;
  }

  img {
    display: block;
    width: min(300px, 75vw, max(0px, calc(100vw - 96px)));
    max-height: min(70vh, max(0px, calc(100vh - 248px)));
    max-height: min(70dvh, max(0px, calc(100dvh - 248px)));
    object-fit: contain;
  }

  .content ::slotted(mc-card-image) {
    --card-size-xl: min(
      300px,
      max(0px, calc((100vh - 248px) / 1.39667)),
      max(0px, calc((100vw - 96px) / 1.39667))
    );
    --card-size-xl: min(
      300px,
      max(0px, calc((100dvh - 248px) / 1.39667)),
      max(0px, calc((100dvw - 96px) / 1.39667))
    );
  }
`;
