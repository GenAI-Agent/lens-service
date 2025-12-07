/**
 * FAB (Floating Action Button) styles
 * All classes prefixed with 'lens-os-agent-' to avoid conflicts
 */

export const fabStyles = `
  .lens-os-agent-fab-container {
    position: fixed;
    bottom: 36px;
    right: 36px;
    display: flex;
    align-items: center;
    gap: 14px;
    z-index: 200;
    transition: all 0.55s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .lens-os-agent-fab-container.panel-open {
    bottom: calc(50% - 310px);
    right: 50%;
    transform: translateX(50%);
  }

  .lens-os-agent-fab-main {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: visible;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:
      0 8px 24px rgba(0, 245, 160, 0.35),
      inset 0 2px 6px rgba(255, 255, 255, 0.6),
      inset 0 -2px 4px rgba(0, 0, 0, 0.15);
    padding: 8px;
  }

  .lens-os-agent-fab-main::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 10%;
    right: 10%;
    height: 35%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.6), transparent);
    border-radius: 50%;
    pointer-events: none;
  }

  .lens-os-agent-fab-main:hover {
    transform: scale(1.08);
    box-shadow:
      0 12px 32px rgba(0, 245, 160, 0.5),
      inset 0 2px 6px rgba(255, 255, 255, 0.7),
      inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  }

  .lens-os-agent-fab-icon {
    width: 62px;
    height: 62px;
    object-fit: contain;
    transition: transform 0.35s ease;
    z-index: 1;
    display: block;
  }

  .lens-os-agent-fab-main:hover .lens-os-agent-fab-icon {
    transform: rotate(20deg);
  }

  .lens-os-agent-fab-ripple {
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(0, 245, 160, 0.2) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 50%;
  }

  .lens-os-agent-fab-main:hover .lens-os-agent-fab-ripple {
    opacity: 1;
  }

  .lens-os-agent-fab-expanded {
    display: flex;
    gap: 10px;
    opacity: 0;
    pointer-events: none;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .lens-os-agent-fab-expanded.left {
    transform: translateX(25px);
  }

  .lens-os-agent-fab-expanded.right {
    transform: translateX(-25px);
  }

  .lens-os-agent-fab-container.panel-open:hover .lens-os-agent-fab-expanded {
    opacity: 1;
    pointer-events: all;
    transform: translateX(0);
  }

  .lens-os-agent-fab-mini {
    width: 46px;
    height: 46px;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: all 0.25s ease;
    position: relative;
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.3),
      inset 0 -2px 3px rgba(0, 0, 0, 0.3);
  }

  .lens-os-agent-fab-mini::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 15%;
    right: 15%;
    height: 30%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.4), transparent);
    border-radius: 50%;
    pointer-events: none;
  }

  .lens-os-agent-fab-mini.active {
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
    color: #1a1a2e;
    box-shadow:
      0 0 20px rgba(0, 245, 160, 0.6),
      inset 0 2px 4px rgba(255, 255, 255, 0.5),
      inset 0 -2px 3px rgba(0, 0, 0, 0.2);
  }

  .lens-os-agent-fab-mini:hover {
    background: rgba(0, 0, 0, 0.5);
    transform: scale(1.15);
  }

  .lens-os-agent-fab-mini::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s ease;
    margin-bottom: 8px;
  }

  .lens-os-agent-fab-mini:hover::after {
    opacity: 1;
  }

  /* Language button wrapper */
  .lens-os-agent-fab-language-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lens-os-agent-fab-language {
    position: relative;
    z-index: 5;
  }

  .lens-os-agent-lang-option {
    position: absolute;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 10;
    top: 50%;
    left: 50%;
    margin-top: -16px;
    margin-left: -16px;
    transform: scale(0);
    box-shadow:
      inset 0 2px 3px rgba(255, 255, 255, 0.25),
      inset 0 -2px 2px rgba(0, 0, 0, 0.3);
  }

  .lens-os-agent-lang-option::before {
    content: '';
    position: absolute;
    top: 1px;
    left: 15%;
    right: 15%;
    height: 30%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.35), transparent);
    border-radius: 50%;
    pointer-events: none;
  }

  .lens-os-agent-fab-container.panel-open:hover .lens-os-agent-lang-option {
    opacity: 1;
    pointer-events: all;
  }

  /* First language option: 50deg (right-upper), 32px distance */
  .lens-os-agent-fab-container.panel-open:hover .lens-os-agent-lang-option[data-position="first"] {
    transform: rotate(50deg) translateY(-32px) rotate(-50deg) scale(1);
  }

  /* Second language option: 130deg (right-lower), 32px distance */
  .lens-os-agent-fab-container.panel-open:hover .lens-os-agent-lang-option[data-position="second"] {
    transform: rotate(130deg) translateY(-32px) rotate(-130deg) scale(1);
  }

  .lens-os-agent-lang-option.active {
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
    border-color: rgba(0, 245, 160, 0.5);
    box-shadow:
      inset 0 2px 3px rgba(255, 255, 255, 0.5),
      inset 0 -2px 2px rgba(0, 0, 0, 0.2);
  }

  .lens-os-agent-lang-option:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  .lens-os-agent-lang-option.active:hover {
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
  }

  .lens-os-agent-flag-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }

  /* Voice Mode Styles */
  .lens-os-agent-fab-main.voice-mode {
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
    box-shadow: 0 8px 24px rgba(255, 107, 107, 0.35);
  }

  .lens-os-agent-fab-main.voice-mode:hover {
    box-shadow: 0 12px 32px rgba(255, 107, 107, 0.5);
  }

  .lens-os-agent-fab-main.listening {
    animation: pulse-mic 1.5s ease-in-out infinite;
  }

  @keyframes pulse-mic {
    0%, 100% {
      box-shadow: 0 8px 24px rgba(255, 107, 107, 0.35);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 12px 32px rgba(255, 107, 107, 0.7), 0 0 0 8px rgba(255, 107, 107, 0.2);
      transform: scale(1.05);
    }
  }

  .lens-os-agent-fab-mic-icon {
    stroke: #fff;
  }

  .lens-os-agent-fab-mic-icon.listening {
    animation: mic-pulse 1.5s ease-in-out infinite;
  }

  @keyframes mic-pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  /* Voice Hint Animation */
  .lens-os-agent-voice-hint {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .lens-os-agent-voice-hint.show {
    opacity: 1;
    animation: bounce-hint 2s ease-in-out infinite;
  }

  @keyframes bounce-hint {
    0%, 20%, 50%, 80%, 100% {
      transform: translateX(-50%) translateY(0);
    }
    40% {
      transform: translateX(-50%) translateY(-10px);
    }
    60% {
      transform: translateX(-50%) translateY(-5px);
    }
  }

  .lens-os-agent-voice-hint svg {
    color: rgba(0, 245, 160, 0.9);
    filter: drop-shadow(0 2px 8px rgba(0, 245, 160, 0.3));
  }

  .lens-os-agent-voice-hint-text {
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(10px);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  /* Dragging State */
  .lens-os-agent-fab-container.dragging .lens-os-agent-fab-main {
    cursor: grabbing;
    transform: scale(1.1);
  }

  .lens-os-agent-fab-container.dragging .lens-os-agent-fab-expanded {
    opacity: 0;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    .lens-os-agent-fab-container.panel-open {
      bottom: calc(50% - 45vh);
      right: calc(50% - 32px);
    }
  }
`;
