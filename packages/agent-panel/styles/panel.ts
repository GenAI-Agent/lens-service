/**
 * Panel styles - glass panel and layout
 * All classes prefixed with 'lens-os-agent-' to avoid conflicts
 */

export const panelStyles = `
  .lens-os-agent-panel * {
    box-sizing: border-box;
  }

  .lens-os-agent-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 720px;
    max-width: 92vw;
    height: 520px;
    max-height: 80vh;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.65), rgba(248, 248, 250, 0.55));
    backdrop-filter: blur(12px);
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.12),
      0 2px 8px rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      inset 0 -1px 0 rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100;
  }

  .lens-os-agent-panel.open {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    pointer-events: all;
  }

  .lens-os-agent-header {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    gap: 10px;
    flex-shrink: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(252, 252, 253, 0.85));
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    position: relative;
    z-index: 10;
  }

  .lens-os-agent-menu-toggle {
    width: 28px;
    height: 28px;
    border: none;
    background-color: transparent;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .lens-os-agent-menu-toggle svg {
    width: 100%;
    height: 100%;
    transition: transform 0.2s ease;
  }

  .lens-os-agent-menu-toggle:hover {
    transform: scale(1.05);
  }

  .lens-os-agent-brand {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: #333;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .lens-os-agent-brand span {
    opacity: 0.6;
    font-weight: 500;
  }

  .lens-os-agent-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
    position: relative;
  }

  .lens-os-agent-sidebar {
    width: 0;
    min-width: 0;
    max-width: 0;
    flex: 0 0 0;
    background: transparent;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-right: none;
    visibility: hidden;
    opacity: 0;
    transform: translateX(-20px);
  }

  .lens-os-agent-sidebar.open {
    width: 160px;
    min-width: 160px;
    max-width: 160px;
    flex: 0 0 160px;
    background: rgba(250, 250, 250, 0.8);
    border-right: 1px solid rgba(0, 0, 0, 0.08);
    visibility: visible;
    opacity: 1;
    transform: translateX(0);
  }

  .lens-os-agent-sidebar-content {
    width: 160px;
    flex: 1;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .lens-os-agent-sidebar.open .lens-os-agent-sidebar-content {
    opacity: 1;
    transition-delay: 0.15s;
  }

  .lens-os-agent-sidebar-item {
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #666;
    font-size: 13px;
    background: transparent;
  }

  .lens-os-agent-sidebar-item.new-session {
    color: #00c896;
    font-weight: 500;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    padding-bottom: 12px;
    border-radius: 0;
  }

  .lens-os-agent-sidebar-item.new-session:hover {
    color: #00a87a;
    background: transparent;
  }

  .lens-os-agent-sidebar-item:hover {
    background: rgba(0, 0, 0, 0.04);
    color: #333;
  }

  .lens-os-agent-sidebar-item.active {
    background: rgba(0, 0, 0, 0.08);
    color: #333;
    font-weight: 500;
  }

  .lens-os-agent-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    padding: 16px 20px;
    min-width: 0;
    overflow: hidden;
    align-items: stretch;
  }

  /* Voice Mode Prompt Styles */
  .lens-os-agent-voice-mode-prompt {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 32px;
    z-index: 1000;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    min-width: 320px;
    text-align: center;
    animation: voicePromptFadeIn 0.3s ease-out;
  }

  @keyframes voicePromptFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -45%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

  .lens-os-agent-voice-mode-prompt h3 {
    margin: 0 0 12px 0;
    color: #00f5a0;
    font-size: 20px;
    font-weight: 600;
  }

  .lens-os-agent-voice-mode-prompt p {
    margin: 0 0 20px 0;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    line-height: 1.6;
  }

  .lens-os-agent-voice-mode-animation {
    margin: 20px 0;
    animation: voiceBounce 1.5s ease-in-out infinite;
  }

  .lens-os-agent-voice-mode-animation svg {
    color: #00f5a0;
    filter: drop-shadow(0 0 10px rgba(0, 245, 160, 0.5));
  }

  @keyframes voiceBounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-12px);
    }
  }

  @media (max-width: 768px) {
    .lens-os-agent-panel {
      width: 96vw;
      height: 88vh;
      border-radius: 20px;
    }

    .lens-os-agent-sidebar.open {
      flex: 0 0 180px;
    }

    .lens-os-agent-brand {
      font-size: 16px;
    }

    .lens-os-agent-voice-mode-prompt {
      min-width: 280px;
      padding: 24px;
    }
  }
`;
