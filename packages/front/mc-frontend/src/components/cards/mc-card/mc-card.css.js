import { css } from 'lit-element';

export default css`
  :host {
    --card-size: 100px;
    --stage-label-height: calc(0.8rem + 6px);

    display: block;
    position: relative;
  }

  :host([size="xs"]) {
    --card-size: 25px;
  }

  :host([size="s"]) {
    --card-size: 50px;
  }

  :host([size="l"]) {
    --card-size: 200px;
  }

  :host([size="xl"]) {
    --card-size: 300px;
  }

  :host([horizontal]) {
    width: calc(var(--card-size) * 1.39667);
  }

  :host([horizontal][rotated]) {
    width: var(--card-size);
  }

  :host([horizontal]) .card-face {
    position: relative;
    width: calc(var(--card-size) * 1.39667);
  }

  :host([horizontal][rotated]) .card-face {
    width: var(--card-size);
  }

  :host(.disabled) .card-front > mc-card-image {
    filter: brightness(var(--disabled-card-brightness, 0.35));
  }

  :host(.playable) .card-front > mc-card-image {
    filter:
      drop-shadow(0 0 4px rgba(255, 235, 59, 0.95))
      drop-shadow(0 0 10px rgba(255, 235, 59, 0.7));
  }
  
  .cards-facedown {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 1px;
    width: max-content;
    margin: 0 auto;
  }

  .card {
    display: flex;
    align-items: flex-start;
    position: relative;
  }

  .facedown-count {
    text-align: center;
  }

  .card.has-tucked-cards {
    padding-bottom: 8px;
  }

  .card-face {
    position: relative;
  }

  .card-front {
    position: relative;
    z-index: 1;
  }

  .tucked {
    display: flex;
    position: absolute;
    top: calc(100% - 8px);
    left: 0;
    right: 0;
    z-index: 0;
    justify-content: center;
    height: 16px;
    overflow: hidden;
    pointer-events: none;
  }

  .tucked-card-peek {
    display: flex;
    align-items: flex-end;
    flex: 0 0 calc(var(--card-size) / 2);
    width: calc(var(--card-size) / 2);
    height: 16px;
    overflow: hidden;
  }

  .tucked-card-peek + .tucked-card-peek {
    margin-left: calc(var(--card-size) * -0.35);
  }

  .tucked-card-peek mc-card-image {
    width: 100%;
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

  :host([horizontal]) header {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    width: 100%;
  }

  :host([horizontal]) header.scheme-title-header {
    align-items: end;
  }

  :host([horizontal]) .scheme-title-header .name {
    box-sizing: border-box;
    width: 100%;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .character-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 2px;
    padding: 0 1px 2px 0;
    font-size: 0.8rem;
    line-height: 1;
    white-space: nowrap;
  }

  .character-stats.stage-aligned {
    margin-top: var(--stage-label-height);
  }

  .character-bottom-stats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    column-gap: 4px;
    row-gap: 2px;
    padding: 0 1px;
    font-size: 0.85rem;
    line-height: 1;
  }

  .character-bottom-values {
    display: flex;
    flex: 0 0 auto;
    justify-content: center;
    gap: 4px;
    white-space: nowrap;
  }

  .acquired-traits {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2px;
    margin-top: 0;
  }

  .acquired-trait {
    display: inline-flex;
    padding: 2px 5px;
    border-radius: 3px;
    background-color: #e0e0e0;
    color: #212121;
    font-family: var(--mc-font-trait, sans-serif);
    font-size: 0.7rem;
    font-weight: 600;
    line-height: 1.1;
    text-transform: capitalize;
  }

  .acquired-keywords {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2px;
    margin-top: 0;
  }

  .acquired-keyword {
    display: inline-flex;
    padding: 2px 5px;
    border-radius: 3px;
    background-color: #e8eef7;
    color: #183153;
    font-family: Georgia, serif;
    font-size: 0.75rem;
    font-style: italic;
    font-weight: 700;
    line-height: 1.1;
  }

  .character-stat {
    display: inline-flex;
    padding: 2px 3px;
    border-radius: 3px;
    color: white;
    font-weight: 600;
  }

  .character-stats .character-stat {
    align-items: center;
    box-sizing: border-box;
    justify-content: center;
    min-width: 1.25rem;
  }

  .character-stats .stat-star {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7em;
    line-height: 1;
  }

  .numeric-value,
  .facedown-count {
    font-family: var(--mc-font-numeric, sans-serif);
  }

  .stat-attack {
    background-color: #d32f2f;
  }

  .stat-thwart,
  .stat-scheme {
    background-color: #1565c0;
  }

  .stat-defense {
    background-color: #1b5e20;
  }

  .stat-counters {
    background-color: #388e3c;
  }

  .stat-recovery {
    background-color: #fdd835;
    color: #212121;
  }

  .stat-life {
    background-color: #ef6c00;
    color: #212121;
  }

  .stat-damage {
    background-color: #b71c1c;
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
    font-family: var(--mc-font-title, sans-serif);
    font-size: 0.85rem;
    font-weight: 700;
    line-height: 1.1;
  }

  :host([horizontal]) .name {
    overflow-wrap: anywhere;
  }

  .header-right {
    text-align: right;
  }

  :host([horizontal]) .header-right {
    justify-self: end;
  }

  .stage-label {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2px;
    height: var(--stage-label-height);
    padding: 0 2px 2px;
  }

  .stage-name {
    overflow: hidden;
    font-size: 0.7rem;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exhausted {
    transform: rotate(15deg);
    bottom: 7px;
  }

  .counters,
  .status {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 3px;
    text-align: center;
  }

  .counters {
    justify-content: center;
    gap: 3px;
  }

  .stat-acceleration {
    background-color: #fff;
    color: #212121;
  }

  .acceleration,
  .threat {
    width: auto;
    margin: 0 auto;
  }

  .status-card {
    font-size: 0.85rem;
    line-height: 1;
  }

  .tough {
    background-color: #ffb74d;
    color: #212121;
  }

  .stunned {
    background-color: #48C548;
    color: #212121;
  }

  .confused {
    background-color: #7a0888;
    color: white;
  }
  
  .attached {
    display: flex;
    justify-content: flex-start;
    padding-left: 2px;
  }
`;
