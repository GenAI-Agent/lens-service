/**
 * Chat Interface Component
 */

import { t } from '../i18n';
import { Message, ToolResult } from '../types';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get friendly display name for tool
 */
function getToolDisplayName(toolName: string): string {
  const toolNames: Record<string, string> = {
    'knowledge_search': '📚 Knowledge Base',
    'web_use': '🌐 Web Action',
  };
  return toolNames[toolName] || toolName;
}

/**
 * Parse and clean assistant content - remove tool tags and complete tags
 */
function parseAssistantContent(content: string): string {
  // Remove <tool>...</tool> blocks completely (they are shown separately)
  let cleaned = content.replace(/<tool>[\s\S]*?<\/tool>/g, '');
  // Remove </complete> tag
  cleaned = cleaned.replace(/<\/complete>/g, '');
  // Clean up extra whitespace
  cleaned = cleaned.trim();
  return cleaned;
}

/**
 * Render tool block with nice styling
 */
function renderToolBlock(tool: ToolResult): string {
  const isPending = tool.status === 'pending';
  const toolName = getToolDisplayName(tool.toolCall.name);

  let resultHtml = '';
  if (isPending) {
    resultHtml = '<div class="lens-os-agent-tool-loading">執行中...</div>';
  } else if (tool.result) {
    // Show simplified result
    const resultText = typeof tool.result === 'string'
      ? tool.result
      : JSON.stringify(tool.result, null, 2);
    resultHtml = `<div class="lens-os-agent-tool-result">${escapeHtml(resultText)}</div>`;
  }

  return `
    <div class="lens-os-agent-tool-block ${isPending ? 'pending' : 'completed'}">
      <div class="lens-os-agent-tool-header">
        <span class="lens-os-agent-tool-name">${toolName}</span>
        ${isPending ? '<span class="lens-os-agent-tool-spinner"></span>' : ''}
      </div>
      ${resultHtml}
    </div>
  `;
}

function renderMessage(msg: Message): string {
  const isUser = msg.role === 'user';

  if (isUser) {
    // User message - keep bubble style
    return `
      <div class="lens-os-agent-message user">
        <div class="lens-os-agent-message-content">${escapeHtml(msg.content)}</div>
      </div>
    `;
  }

  // Assistant message - full width, no box
  const cleanedContent = parseAssistantContent(msg.content);

  // Render tool blocks if any
  let toolsHtml = '';
  if (msg.tools && msg.tools.length > 0) {
    toolsHtml = msg.tools.map(tool => renderToolBlock(tool)).join('');
  }

  return `
    <div class="lens-os-agent-message assistant">
      ${cleanedContent ? `<div class="lens-os-agent-message-content">${escapeHtml(cleanedContent)}</div>` : ''}
      ${toolsHtml}
    </div>
  `;
}

export function renderChatInterface(
  messages: Message[],
  currentInput: string,
  language: string
): string {
  return `
    <div class="lens-os-agent-chat">
      <div class="lens-os-agent-messages" id="messagesArea">
        ${messages.map(msg => renderMessage(msg)).join('')}
      </div>

      <div class="lens-os-agent-input-area">
        <div class="lens-os-agent-input-wrapper">
          <textarea class="lens-os-agent-input" id="chatInput" placeholder="${t('inputPlaceholder', language)}" rows="1">${escapeHtml(currentInput)}</textarea>
          <button class="lens-os-agent-send-btn" id="sendBtn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}
