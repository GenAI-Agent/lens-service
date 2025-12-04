/**
 * Auto-mode prompt and tool confirmation styles
 * All classes prefixed with 'lens-os-agent-' to avoid conflicts
 */

export const promptStyles = `
  .lens-os-agent-auto-mode-prompt,
  .lens-os-agent-tool-confirmation {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 18px;
    padding: 24px 28px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    min-width: 400px;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  .lens-os-agent-prompt-content,
  .lens-os-agent-confirmation-content {
    text-align: center;
  }

  .lens-os-agent-prompt-content h3,
  .lens-os-agent-confirmation-content h3 {
    color: #333;
    font-size: 20px;
    margin-bottom: 12px;
    font-weight: 600;
  }

  .lens-os-agent-prompt-content p,
  .lens-os-agent-confirmation-content p {
    color: #666;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .lens-os-agent-confirmation-content pre {
    background: rgba(0, 0, 0, 0.05);
    padding: 12px;
    border-radius: 8px;
    font-size: 12px;
    text-align: left;
    margin-bottom: 16px;
    max-height: 120px;
    overflow-y: auto;
  }

  .lens-os-agent-prompt-buttons,
  .lens-os-agent-confirmation-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
  }

  .lens-os-agent-prompt-btn,
  .lens-os-agent-confirm-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lens-os-agent-prompt-btn.agree,
  .lens-os-agent-confirm-btn.agree {
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
    color: #1a1a2e;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    padding: 0;
  }

  .lens-os-agent-prompt-btn.deny,
  .lens-os-agent-confirm-btn.deny {
    background: rgba(244, 67, 54, 0.1);
    color: #f44336;
    border: 1px solid rgba(244, 67, 54, 0.3);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    padding: 0;
  }

  .lens-os-agent-prompt-btn:hover,
  .lens-os-agent-confirm-btn:hover {
    transform: translateY(-2px) scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .lens-os-agent-prompt-btn svg,
  .lens-os-agent-confirm-btn svg {
    width: 24px;
    height: 24px;
  }

  .lens-os-agent-custom-input-area {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 8px;
  }

  .lens-os-agent-custom-input-area input {
    flex: 1;
    padding: 10px 16px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    font-size: 13px;
    outline: none;
  }

  .lens-os-agent-confirm-btn.custom {
    background: rgba(0, 0, 0, 0.05);
    color: #333;
  }

  @media (max-width: 768px) {
    .lens-os-agent-auto-mode-prompt,
    .lens-os-agent-tool-confirmation {
      min-width: 90%;
    }
  }
`;
