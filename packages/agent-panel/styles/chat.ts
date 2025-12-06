/**
 * Chat interface styles
 * All classes prefixed with 'lens-os-agent-' to avoid conflicts
 */

export const chatStyles = `
  .lens-os-agent-chat {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .lens-os-agent-messages {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
    margin-bottom: 10px;
    min-height: 50px;
  }

  .lens-os-agent-messages::-webkit-scrollbar {
    width: 5px;
  }

  .lens-os-agent-messages::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.03);
    border-radius: 3px;
  }

  .lens-os-agent-messages::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }

  .lens-os-agent-message {
    margin-bottom: 8px;
    animation: lens-os-agent-slideIn 0.3s ease;
  }

  @keyframes lens-os-agent-slideIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .lens-os-agent-message.user {
    padding: 10px 14px;
    border-radius: 10px;
    max-width: 75%;
    width: fit-content;
    background: linear-gradient(135deg, rgba(0, 245, 160, 0.25) 0%, rgba(0, 217, 245, 0.25) 100%);
    color: #000;
    margin-left: auto;
    font-weight: 500;
  }

  .lens-os-agent-message.assistant {
    /* Full width, no background, no border */
    width: 100%;
    max-width: 100%;
    background: transparent;
    color: #333;
    padding: 4px 0;
  }

  .lens-os-agent-message-content {
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .lens-os-agent-message.assistant .lens-os-agent-message-content {
    padding: 0 4px;
  }

  .lens-os-agent-input-area {
    margin-top: auto;
    padding-top: 8px;
    flex-shrink: 0;
    background: transparent;
    position: relative;
    z-index: 5;
  }

  .lens-os-agent-input-wrapper {
    position: relative;
    display: flex;
    align-items: flex-end;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 10px;
    overflow: hidden;
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.06),
      inset -1px -1px 3px rgba(255, 255, 255, 0.8),
      0 1px 2px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
  }

  .lens-os-agent-input-wrapper:focus-within {
    background: rgba(255, 255, 255, 0.85);
    border-color: rgba(0, 200, 150, 0.4);
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.05),
      inset -1px -1px 3px rgba(255, 255, 255, 0.9),
      0 0 0 2px rgba(0, 245, 160, 0.15);
  }

  .lens-os-agent-input {
    flex: 1;
    padding: 10px 86px 10px 14px;
    background: transparent;
    border: none;
    font-size: 14px;
    color: #333;
    outline: none;
    font-family: inherit;
    resize: none;
    min-height: 40px;
    max-height: 120px;
    overflow-y: auto;
    line-height: 1.4;
  }

  .lens-os-agent-input::placeholder {
    color: #999;
  }

  .lens-os-agent-input:focus {
    background: transparent;
    outline: none;
    box-shadow: none;
  }

  .lens-os-agent-input::-webkit-scrollbar {
    width: 4px;
  }

  .lens-os-agent-input::-webkit-scrollbar-track {
    background: transparent;
  }

  .lens-os-agent-input::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 2px;
  }

  .lens-os-agent-voice-btn {
    position: absolute;
    right: 44px;
    bottom: 6px;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #555;
    transition: all 0.3s ease;
    flex-shrink: 0;
    box-shadow: 0 0 0 0 rgba(255, 107, 107, 0);
  }

  .lens-os-agent-voice-btn:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(1.05);
  }

  .lens-os-agent-voice-btn.listening {
    background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%) !important;
    color: white !important;
    box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.2), 0 4px 12px rgba(255, 107, 107, 0.4);
    animation: lens-os-agent-pulse 1.5s ease-in-out infinite;
  }

  @keyframes lens-os-agent-pulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.2), 0 4px 12px rgba(255, 107, 107, 0.4);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 0 0 6px rgba(255, 107, 107, 0.3), 0 6px 16px rgba(255, 107, 107, 0.5);
    }
  }

  .lens-os-agent-send-btn {
    position: absolute;
    right: 6px;
    bottom: 6px;
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1a1a2e;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .lens-os-agent-send-btn:hover {
    transform: scale(1.05);
    opacity: 0.9;
  }

  /* Tool Block Styles */
  .lens-os-agent-tool-block {
    margin: 8px 0;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }

  .lens-os-agent-tool-block.pending {
    border-color: rgba(0, 200, 150, 0.3);
    background: rgba(0, 245, 160, 0.05);
  }

  .lens-os-agent-tool-block.completed {
    border-color: rgba(0, 0, 0, 0.08);
  }

  .lens-os-agent-tool-header {
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.06);
    font-size: 12px;
    font-weight: 600;
    color: #555;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .lens-os-agent-tool-name {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .lens-os-agent-tool-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0, 245, 160, 0.3);
    border-top-color: #00f5a0;
    border-radius: 50%;
    animation: lens-os-agent-spin 0.8s linear infinite;
  }

  @keyframes lens-os-agent-spin {
    to { transform: rotate(360deg); }
  }

  .lens-os-agent-tool-loading {
    padding: 10px 12px;
    font-size: 12px;
    color: #00c896;
    font-style: italic;
  }

  .lens-os-agent-tool-result {
    padding: 10px 12px;
    font-size: 11px;
    font-family: 'Courier New', monospace;
    color: #555;
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 150px;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.5);
  }

  .lens-os-agent-tool-result::-webkit-scrollbar {
    width: 4px;
  }

  .lens-os-agent-tool-result::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 2px;
  }

  /* Inline Tool Call Styles */
  .lens-os-agent-tool-inline {
    display: block;
    width: fit-content;
    padding: 6px 12px;
    margin: 6px 0;
    background: linear-gradient(135deg, rgba(0, 245, 160, 0.08) 0%, rgba(0, 217, 245, 0.08) 100%);
    border: 1px solid rgba(0, 200, 150, 0.25);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: #00a0c8;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .lens-os-agent-tool-inline:hover {
    background: linear-gradient(135deg, rgba(0, 245, 160, 0.12) 0%, rgba(0, 217, 245, 0.12) 100%);
    border-color: rgba(0, 200, 150, 0.4);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 200, 150, 0.15);
  }

  .lens-os-agent-tool-inline-expanded {
    display: block;
    margin: 8px 0;
    padding: 12px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 200, 150, 0.2);
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .lens-os-agent-tool-inline-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    font-size: 13px;
    font-weight: 600;
    color: #00a0c8;
  }

  .lens-os-agent-tool-inline-content {
    font-size: 12px;
    line-height: 1.6;
    color: #333;
    background: transparent;
  }

  .lens-os-agent-tool-inline-content strong {
    color: #555;
    font-weight: 600;
    margin-right: 4px;
  }
`;
