import { css } from 'lit-element';

export default css`
  :host {
    --card-size: 100px;

    display: block;
    position: relative;
  }
  
  .cards-facedown {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 2px;
    width: max-content;
    margin: 0 auto;
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
    align-items: center;
    justify-content: space-between;
    gap: 2px;
  }

  .character-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 2px;
    padding: 0 2px 4px 0;
    font-size: 0.8rem;
    line-height: 1;
    white-space: nowrap;
  }

  .character-bottom-stats {
    display: flex;
    justify-content: center;
    gap: 6px;
    padding: 4px 2px 0;
    font-size: 0.85rem;
    line-height: 1;
    white-space: nowrap;
  }

  .acquired-traits {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 3px;
    margin-top: 4px;
  }

  .acquired-trait {
    display: inline-flex;
    padding: 2px 5px;
    border-radius: 3px;
    background-color: #e0e0e0;
    color: #212121;
    font-size: 0.7rem;
    font-weight: 600;
    line-height: 1.1;
    text-transform: capitalize;
  }

  .character-stat {
    display: inline-flex;
    padding: 2px 3px;
    border-radius: 3px;
    color: white;
    font-weight: 600;
  }

  .stat-attack {
    background-color: #d32f2f;
  }

  .stat-thwart,
  .stat-scheme {
    background-color: #1565c0;
  }

  .stat-defense {
    background-color: #2e7d32;
  }

  .stat-recovery {
    background-color: #fdd835;
    color: #212121;
  }

  .stat-life {
    background-color: #ff6d00;
  }

  .stat-hand-size {
    background-color: #212121;
  }

  .stat-stage {
    background-color: #212121;
    color: #fff;
  }

  .stat-threat {
    background-color: #fdd835;
    color: #212121;
  }

  .header-stat {
    font-size: 0.8rem;
    line-height: 1;
  }

  .header-left {
    text-align: left;
  }

  .name {
    flex: 1;
    min-width: 0;
    text-align: center;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    line-height: 1.1;
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

  .counters {
    justify-content: center;
    gap: 4px;
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
    width: auto;
    margin: 0 auto;
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
