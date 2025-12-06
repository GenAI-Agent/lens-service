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
 * Parse assistant content and replace <tool>...</tool> with inline placeholders
 * Returns { html, tools } where html has placeholders and tools is array of tool contents
 */
function parseAssistantContentWithTools(content: string, language: string): { html: string; inlineTools: string[] } {
  const inlineTools: string[] = [];
  let index = 0;

  // Replace <tool>...</tool> with block tool placeholder (one per line)
  const html = content
    .replace(/<tool>([\s\S]*?)<\/tool>/g, (_match, toolContent) => {
      inlineTools.push(toolContent.trim());
      const placeholderId = `tool-inline-${index}`;
      index++;
      return `<div class="lens-os-agent-tool-inline" data-tool-id="${placeholderId}">${t('toolCall', language)}</div>`;
    })
    .replace(/<\/complete>/g, '')
    .trim();

  return { html, inlineTools };
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

function renderMessage(msg: Message, language: string): string {
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
  const { html, inlineTools } = parseAssistantContentWithTools(msg.content, language);

  // Render tool blocks if any
  let toolsHtml = '';
  if (msg.tools && msg.tools.length > 0) {
    toolsHtml = msg.tools.map(tool => renderToolBlock(tool)).join('');
  }

  return `
    <div class="lens-os-agent-message assistant">
      ${html ? `<div class="lens-os-agent-message-content">${html}</div>` : ''}
      ${toolsHtml}
      ${inlineTools.length > 0 ? `<script type="application/json" class="inline-tools-data">${JSON.stringify(inlineTools)}</script>` : ''}
    </div>
  `;
}

export function renderChatInterface(
  messages: Message[],
  currentInput: string,
  language: string,
  isListening: boolean = false
): string {
  return `
    <div class="lens-os-agent-chat">
      <div class="lens-os-agent-messages" id="messagesArea">
        ${messages.map(msg => renderMessage(msg, language)).join('')}
      </div>

      <div class="lens-os-agent-input-area">
        <div class="lens-os-agent-input-wrapper">
          <textarea class="lens-os-agent-input" id="chatInput" placeholder="${t('inputPlaceholder', language)}" rows="1">${escapeHtml(currentInput)}</textarea>
          <button class="lens-os-agent-voice-btn ${isListening ? 'listening' : ''}" id="voiceBtn" title="${t('voiceInput', language)}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
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
