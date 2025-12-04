/**
 * Contact form styles
 * All classes prefixed with 'lens-os-agent-' to avoid conflicts
 */

export const formStyles = `
  .lens-os-agent-contact-form {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
    padding: 0 16px;
  }

  .lens-os-agent-form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  .lens-os-agent-form-header h2 {
    color: #333;
    font-size: 18px;
    font-weight: 600;
  }

  .lens-os-agent-back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.1);
    padding: 6px 14px;
    border-radius: 18px;
    color: #333;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.25s ease;
    font-family: inherit;
  }

  .lens-os-agent-back-btn:hover {
    background: rgba(0, 0, 0, 0.08);
    transform: translateX(-4px);
  }

  .lens-os-agent-form-body {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
    padding-bottom: 20px;
  }

  .lens-os-agent-form-body::-webkit-scrollbar {
    width: 5px;
  }

  .lens-os-agent-form-body::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.03);
    border-radius: 3px;
  }

  .lens-os-agent-form-body::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }

  .lens-os-agent-form-group {
    margin-bottom: 14px;
  }

  .lens-os-agent-form-group label {
    display: block;
    color: #333;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 6px;
  }

  .lens-os-agent-form-group input,
  .lens-os-agent-form-group select,
  .lens-os-agent-form-group textarea {
    width: 100%;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 10px;
    font-size: 13px;
    color: #333;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.06),
      inset -1px -1px 3px rgba(255, 255, 255, 0.8),
      0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .lens-os-agent-form-group input:focus,
  .lens-os-agent-form-group select:focus,
  .lens-os-agent-form-group textarea:focus {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(0, 200, 150, 0.4);
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.05),
      inset -1px -1px 3px rgba(255, 255, 255, 0.9),
      0 0 0 2px rgba(0, 245, 160, 0.15);
  }

  .lens-os-agent-form-group textarea {
    resize: vertical;
    min-height: 110px;
  }

  .lens-os-agent-submit-btn {
    width: 100%;
    padding: 10px 20px;
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #1a1a2e;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.25s ease;
    margin-top: 12px;
    font-family: inherit;
    box-shadow: 0 4px 12px rgba(0, 245, 160, 0.3);
  }

  .lens-os-agent-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 245, 160, 0.4);
  }
`;
