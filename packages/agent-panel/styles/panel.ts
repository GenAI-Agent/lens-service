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
    background: rgba(255, 255, 255, 0.92);
    border-radius: 24px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
    background: rgba(255, 255, 255, 0.95);
    position: relative;
    z-index: 10;
  }

  .lens-os-agent-menu-toggle {
    background: rgba(0, 0, 0, 0.05);
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.25s ease;
    flex-shrink: 0;
  }

  .lens-os-agent-menu-toggle:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(1.05);
  }

  .lens-os-agent-menu-toggle .bar {
    width: 16px;
    height: 2px;
    background: #333;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  .lens-os-agent-menu-toggle.active .bar:nth-child(1) {
    transform: rotate(45deg) translate(4px, 4px);
  }

  .lens-os-agent-menu-toggle.active .bar:nth-child(2) {
    opacity: 0;
  }

  .lens-os-agent-menu-toggle.active .bar:nth-child(3) {
    transform: rotate(-45deg) translate(4px, -4px);
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
    transition: all 0.3s ease;
    border-right: none;
    visibility: hidden;
    opacity: 0;
  }

  .lens-os-agent-sidebar.open {
    width: 160px;
    min-width: 160px;
    max-width: 160px;
    flex: 0 0 160px;
    background: rgba(250, 250, 250, 0.5);
    border-right: 1px solid rgba(0, 0, 0, 0.08);
    visibility: visible;
    opacity: 1;
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
  }
`;
