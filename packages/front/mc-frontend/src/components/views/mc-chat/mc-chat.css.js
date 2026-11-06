import {css} from 'lit-element';

export default css`
  :host {
    position: fixed;
    z-index: 20;
    left: 16px;
    bottom: 16px;
    width: min(320px, calc(100vw - 32px));
    max-height: min(360px, calc(100vh - 32px));
    pointer-events: none;
  }

  .chat {
    display: flex;
    flex-direction: column;
    max-height: inherit;
    overflow: hidden;
    border: 1px solid #d5cfdf;
    border-radius: 16px;
    background: #fff;
    box-shadow: 0 4px 18px rgb(0 0 0 / 22%);
    pointer-events: auto;
  }

  .chat-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    padding: 8px 12px;
    border: 0;
    background: #f7f5fb;
    color: inherit;
    font: inherit;
    font-weight: 600;
    text-align: left;
    cursor: pointer;
  }

  .chat-toggle:focus-visible,
  form button:focus-visible,
  form input:focus-visible {
    outline: 2px solid var(--mc-color-primary, #6750a4);
    outline-offset: -2px;
  }

  .chat-status {
    color: #a32626;
    font-size: 0.8rem;
  }

  .chevron {
    flex: 0 0 auto;
    width: 0.5rem;
    height: 0.5rem;
    margin-left: auto;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg);
  }

  .chevron.open {
    transform: rotate(225deg);
  }

  .chat-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    padding: 8px;
  }

  .messages {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .message {
    display: grid;
    gap: 2px;
    overflow-wrap: anywhere;
    font-size: 0.9rem;
  }

  .message strong {
    font-size: 0.8rem;
  }

  form {
    display: flex;
    gap: 6px;
  }

  form input {
    flex: 1;
    min-width: 0;
    padding: 8px;
    border: 1px solid #d5cfdf;
    border-radius: 8px;
    font: inherit;
  }

  form button {
    padding: 8px 10px;
    border: 0;
    border-radius: 8px;
    background: var(--mc-color-primary, #6750a4);
    color: #fff;
    font: inherit;
    cursor: pointer;
  }

  form button:disabled {
    cursor: default;
    opacity: 0.55;
  }

  .chat-error,
  .chat-disabled {
    margin: 0;
    font-size: 0.85rem;
  }

  .chat-error {
    color: #a32626;
  }
`;
