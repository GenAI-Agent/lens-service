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
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(0, 200, 150, 0.2);
    color: #000;
    margin-left: auto;
    font-weight: 500;
    box-shadow:
      inset 2px 2px 4px rgba(255, 255, 255, 0.4),
      inset -1px -1px 3px rgba(0, 0, 0, 0.1),
      0 2px 4px rgba(0, 0, 0, 0.05);
    position: relative;
    overflow: hidden;
  }

  .lens-os-agent-message.user::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
    pointer-events: none;
  }

  .lens-os-agent-message.assistant {
    /* Full width, no background, no border */
    width: 100%;
    max-width: 100%;
    background: transparent;
    color: #333;
    padding: 0;
    margin-bottom: 4px;
  }

  .lens-os-agent-message-content {
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin-bottom: 2px;
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
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    overflow: hidden;
    box-shadow:
      inset 3px 3px 8px rgba(0, 0, 0, 0.15),
      inset -2px -2px 6px rgba(255, 255, 255, 0.6),
      0 2px 4px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
  }

  .lens-os-agent-input-wrapper:focus-within {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(0, 200, 150, 0.3);
    box-shadow:
      inset 3px 3px 8px rgba(0, 0, 0, 0.12),
      inset -2px -2px 6px rgba(255, 255, 255, 0.7),
      0 0 0 2px rgba(0, 245, 160, 0.15),
      0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .lens-os-agent-input {
    flex: 1;
    padding: 10px 10px 10px 14px;
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
    right: 12px;
    bottom: 6px;
    width: 32px;
    height: 32px;
    background: rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #555;
    transition: all 0.3s ease;
    flex-shrink: 0;
    box-shadow:
      inset 0 1px 3px rgba(255, 255, 255, 0.4),
      inset 0 -1px 2px rgba(0, 0, 0, 0.15);
    position: relative;
    overflow: hidden;
  }

  .lens-os-agent-voice-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 35%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
    pointer-events: none;
  }

  .lens-os-agent-voice-btn:hover {
    background: rgba(0, 0, 0, 0.12);
    transform: scale(1.05);
    box-shadow:
      inset 0 1px 3px rgba(255, 255, 255, 0.5),
      inset 0 -1px 2px rgba(0, 0, 0, 0.2);
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
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.6),
      inset 0 -2px 3px rgba(0, 0, 0, 0.15),
      0 1px 3px rgba(0, 245, 160, 0.2);
    position: relative;
    overflow: hidden;
  }

  .lens-os-agent-send-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 35%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.5), transparent);
    pointer-events: none;
  }

  .lens-os-agent-send-btn:hover {
    transform: scale(1.05);
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.7),
      inset 0 -2px 3px rgba(0, 0, 0, 0.2),
      0 2px 6px rgba(0, 245, 160, 0.3);
  }

  /* Tool Block Styles */
  .lens-os-agent-tool-block {
    margin: 2px 0;
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

  /* Compact Tool Block - Keep box but no result expansion */
  .lens-os-agent-tool-block-compact {
    display: inline-block;
    padding: 4px 10px;
    margin: 2px 4px 2px 0;
    background: linear-gradient(135deg, rgba(0, 245, 160, 0.08) 0%, rgba(0, 217, 245, 0.08) 100%);
    border: 1px solid rgba(0, 200, 150, 0.25);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: #00a0c8;
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.3),
      inset 0 -1px 2px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
  }

  .lens-os-agent-tool-block-compact::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25), transparent);
    pointer-events: none;
  }

  .lens-os-agent-tool-block-compact.pending {
    border-color: rgba(0, 200, 150, 0.3);
    background: rgba(0, 245, 160, 0.1);
  }

  .lens-os-agent-tool-block-compact .lens-os-agent-tool-name {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .lens-os-agent-tool-block-compact .lens-os-agent-tool-spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    margin-left: 6px;
    border: 2px solid rgba(0, 245, 160, 0.3);
    border-top-color: #00f5a0;
    border-radius: 50%;
    animation: lens-os-agent-spin 0.8s linear infinite;
  }

  /* Inline Tool Call Styles - Full Width Clickable */
  .lens-os-agent-tool-inline {
    display: block;
    width: 100%;
    margin: 6px 0;
    padding: 12px 16px;
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
    border: 1px solid rgba(0, 200, 150, 0.4);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow:
      0 2px 6px rgba(0, 245, 160, 0.2),
      inset 0 2px 4px rgba(255, 255, 255, 0.5),
      inset 0 -2px 3px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
    overflow: hidden;
  }

  .lens-os-agent-tool-inline::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 45%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.4), transparent);
    pointer-events: none;
  }

  .lens-os-agent-tool-inline:hover {
    transform: translateY(-2px);
    box-shadow:
      0 4px 12px rgba(0, 245, 160, 0.35),
      inset 0 2px 4px rgba(255, 255, 255, 0.6),
      inset 0 -2px 3px rgba(0, 0, 0, 0.2);
    border-color: rgba(0, 200, 150, 0.6);
  }

  .lens-os-agent-tool-inline .tool-icon {
    font-size: 18px;
  }

  .lens-os-agent-tool-inline .tool-text {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: #000;
  }

  .lens-os-agent-tool-inline .tool-expand-hint {
    font-size: 11px;
    color: rgba(0, 0, 0, 0.5);
    font-weight: 400;
  }

  .lens-os-agent-tool-inline-expanded {
    display: block;
    margin: 0 0 8px 0;
    padding: 8px 12px;
    background: linear-gradient(135deg, rgba(0, 245, 160, 0.08) 0%, rgba(0, 217, 245, 0.08) 100%);
    border: 1px solid rgba(0, 200, 150, 0.25);
    border-radius: 8px;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.06),
      inset 0 1px 3px rgba(255, 255, 255, 0.4),
      inset 0 -1px 2px rgba(0, 0, 0, 0.1);
    font-size: 12px;
    line-height: 1.2;
    color: #333;
    position: relative;
    overflow: hidden;
  }

  .lens-os-agent-tool-inline-expanded::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
    pointer-events: none;
  }

  .lens-os-agent-tool-inline-expanded .tool-name-row {
    font-size: 13px;
    font-weight: 600;
    color: #000;
    margin-bottom: 3px;
    line-height: 1.3;
  }

  .lens-os-agent-tool-inline-expanded .params-list {
    font-size: 12px;
    line-height: 1.3;
    color: #333;
  }

  .lens-os-agent-tool-inline-expanded .param-item {
    margin-bottom: 0;
    line-height: 1.3;
  }

  .lens-os-agent-tool-inline-expanded .param-key {
    font-weight: 600;
    color: #000;
    margin-right: 4px;
  }

  .lens-os-agent-tool-inline-expanded .param-value {
    color: #333;
  }

  /* Memory Summary Styles - Full Width with Gradient */
  .lens-os-agent-memory-summary {
    display: block;
    width: 100%;
    margin: 6px 0;
  }

  .lens-os-agent-memory-summary .memory-summary-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 16px;
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
    border: 1px solid rgba(0, 200, 150, 0.4);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow:
      0 2px 6px rgba(0, 245, 160, 0.2),
      inset 0 2px 4px rgba(255, 255, 255, 0.5),
      inset 0 -2px 3px rgba(0, 0, 0, 0.15);
    position: relative;
    overflow: hidden;
  }

  .lens-os-agent-memory-summary .memory-summary-toggle::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 45%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.4), transparent);
    pointer-events: none;
  }

  .lens-os-agent-memory-summary .memory-summary-toggle:hover {
    transform: translateY(-2px);
    box-shadow:
      0 4px 12px rgba(0, 245, 160, 0.35),
      inset 0 2px 4px rgba(255, 255, 255, 0.6),
      inset 0 -2px 3px rgba(0, 0, 0, 0.2);
    border-color: rgba(0, 200, 150, 0.6);
  }

  .lens-os-agent-memory-summary .memory-icon {
    font-size: 18px;
  }

  .lens-os-agent-memory-summary .memory-text {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: #000;
  }

  .lens-os-agent-memory-summary .memory-summary-content {
    display: block;
    margin: 0;
    margin-top: -6px;
    padding: 14px 16px;
    background: linear-gradient(135deg, rgba(0, 245, 160, 0.08) 0%, rgba(0, 217, 245, 0.08) 100%);
    border: 1px solid rgba(0, 200, 150, 0.25);
    border-top: none;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 2px 6px rgba(0, 245, 160, 0.1);
    font-size: 12px;
    line-height: 1.5;
    color: #333;
  }

  .lens-os-agent-memory-summary .memory-summary-content h1,
  .lens-os-agent-memory-summary .memory-summary-content h2,
  .lens-os-agent-memory-summary .memory-summary-content h3 {
    margin: 10px 0 6px 0;
    font-weight: 600;
    color: #000;
    line-height: 1.4;
  }

  .lens-os-agent-memory-summary .memory-summary-content h1 { font-size: 15px; }
  .lens-os-agent-memory-summary .memory-summary-content h2 { font-size: 14px; }
  .lens-os-agent-memory-summary .memory-summary-content h3 { font-size: 13px; }

  .lens-os-agent-memory-summary .memory-summary-content li {
    margin-left: 20px;
    margin-bottom: 4px;
    line-height: 1.5;
  }

  .lens-os-agent-memory-summary .memory-summary-content strong {
    font-weight: 600;
    color: #000;
  }

  .lens-os-agent-memory-summary .memory-summary-content br {
    line-height: 1.5;
  }

  /* Thinking Animation */
  .lens-os-agent-thinking {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    color: #666;
    font-size: 13px;
    font-style: italic;
  }

  .lens-os-agent-thinking-dots {
    display: flex;
    gap: 4px;
  }

  .lens-os-agent-thinking-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #00c896;
    animation: lens-os-agent-thinking-bounce 1.4s ease-in-out infinite;
  }

  .lens-os-agent-thinking-dot:nth-child(1) {
    animation-delay: 0s;
  }

  .lens-os-agent-thinking-dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .lens-os-agent-thinking-dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes lens-os-agent-thinking-bounce {
    0%, 60%, 100% {
      transform: translateY(0);
      opacity: 0.7;
    }
    30% {
      transform: translateY(-10px);
      opacity: 1;
    }
  }

  /* Skill Autocomplete Dropdown */
  .lens-os-agent-skill-dropdown {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    margin-bottom: 5px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
  }

  .lens-os-agent-skill-item {
    padding: 10px 14px;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid #f5f5f5;
  }

  .lens-os-agent-skill-item:last-child {
    border-bottom: none;
  }

  .lens-os-agent-skill-item:hover,
  .lens-os-agent-skill-item.selected {
    background-color: #f0f9ff;
  }

  .lens-os-agent-skill-name {
    font-weight: 600;
    color: #00d084;
    font-size: 13px;
  }

  .lens-os-agent-skill-prompt {
    font-size: 11px;
    color: #666;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
