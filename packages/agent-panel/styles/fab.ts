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
    background: transparent;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: visible;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
    padding: 0;
  }

  .lens-os-agent-fab-main:hover {
    transform: scale(1.08);
    box-shadow: none;
  }

  .lens-os-agent-fab-icon {
    width: 64px;
    height: 64px;
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
  }

  .lens-os-agent-fab-mini.active {
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
    color: #1a1a2e;
    box-shadow: 0 0 20px rgba(0, 245, 160, 0.6);
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

  @media (max-width: 768px) {
    .lens-os-agent-fab-container.panel-open {
      bottom: calc(50% - 45vh);
      right: calc(50% - 32px);
    }
  }
`;
