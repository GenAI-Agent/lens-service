/**
 * Lens Agent Panel - Main Entry Point
 */

import { AgentPanelConfig, PanelMode, Session, Message, ToolCall } from './types';
import { t } from './i18n';
import { getAllStyles } from './styles';
import { renderChatInterface, renderSidebar, renderFAB, ContactFormDynamic } from './components';
import { SpeechRecognitionService } from './services/SpeechRecognition';

// Re-export types for external use
export type { ToolCall, ToolResult, PanelMode, Session, AgentPanelConfig } from './types';

// Helper function
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export class AgentPanel {
  private container: HTMLElement;
  private config: AgentPanelConfig;
  private mode: PanelMode = 'agent';
  private sessionId: string = '';
  private isOpen: boolean = false;
  private isSidebarOpen: boolean = false;
  private sessions: Session[] = [];
  private messages: Message[] = [];
  private currentInput: string = '';
  private language: string = 'zh-TW';
  private autoMode: boolean = false;
  private hasAskedAutoMode: boolean = false;
  private contactForm: ContactFormDynamic;
  private speechRecognition: SpeechRecognitionService;
  private isThinking: boolean = false;

  constructor(config: AgentPanelConfig) {
    this.container = document.createElement('div');
    this.config = config;
    this.contactForm = new ContactFormDynamic(config.apiUrl);
    this.speechRecognition = new SpeechRecognitionService();
  }

  public async mount(container: HTMLElement): Promise<void> {
    this.container = container;
    await this.loadSessions();
    this.render();
  }

  public async open(): Promise<void> {
    this.isOpen = true;
    // Only create new session if we don't have one
    if (!this.sessionId) {
      await this.createNewSession();
    }
    this.render();

    if (!this.hasAskedAutoMode) {
      setTimeout(() => this.showAutoModePrompt(), 500);
    }
  }

  public close(): void {
    this.isOpen = false;
    this.render();
  }

  public isExecuting(): boolean {
    return false;
  }

  private togglePanel(): void {
    this.isOpen = !this.isOpen;
    this.render();

    if (this.isOpen && !this.hasAskedAutoMode) {
      setTimeout(() => this.showAutoModePrompt(), 500);
    }
  }

  private toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    this.render();
  }

  private showAutoModePrompt(): void {
    const promptHtml = `
      <div class="lens-os-agent-auto-mode-prompt" id="autoModePrompt">
        <div class="lens-os-agent-prompt-content">
          <h3>執行模式</h3>
          <p>是否允許全 AI 自動操作?<br/>Allow AI to automatically execute everything?</p>
          <div class="lens-os-agent-prompt-buttons">
            <button class="lens-os-agent-prompt-btn deny" data-action="deny-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            <button class="lens-os-agent-prompt-btn agree" data-action="agree-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    const panel = document.getElementById('lensOsAgentPanel');
    if (panel) {
      panel.insertAdjacentHTML('afterbegin', promptHtml);
      this.attachPromptListeners();
    }
  }

  private attachPromptListeners(): void {
    document.querySelectorAll('[data-action="agree-auto"], [data-action="deny-auto"]').forEach(el => {
      el.addEventListener('click', (e) => {
        const action = (e.currentTarget as HTMLElement).dataset.action;
        this.autoMode = action === 'agree-auto';
        this.hasAskedAutoMode = true;

        const prompt = document.getElementById('autoModePrompt');
        if (prompt) prompt.remove();

        this.render();
      });
    });
  }

  private async render(): Promise<void> {
    const mainContent = this.mode === 'agent'
      ? renderChatInterface(this.messages, this.currentInput, this.language, this.speechRecognition.getIsListening(), this.isThinking)
      : this.contactForm.render(this.language);

    this.container.innerHTML = `
      <!-- Glass Panel -->
      <div class="lens-os-agent-panel ${this.isOpen ? 'open' : ''}" id="lensOsAgentPanel">
        <!-- Panel Header -->
        <div class="lens-os-agent-header">
          <button class="lens-os-agent-menu-toggle ${this.isSidebarOpen ? 'active' : ''}" id="menuToggle">
            <svg width="28" height="28" viewBox="0 0 65 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.6501 26.8306L24.9088 29.084L27.6775 29.5844C28.5254 28.0816 30.0467 27.0531 31.7673 26.8306H22.6501Z" fill="#121212"/>
              <path d="M42.3499 37.7283L40.0938 35.4775L37.2794 34.9688C36.432 36.4752 34.9086 37.5058 33.1854 37.7283H42.3499Z" fill="#121212"/>
              <path d="M33.1765 26.8306C33.2621 26.8416 33.3479 26.8547 33.4338 26.8698C35.0025 27.1461 36.2977 28.0596 37.0999 29.2963L38.1911 28.0171C36.6474 27.2489 34.9334 26.8358 33.1765 26.8306Z" fill="#121212"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M37.0999 29.2963L37.1014 29.2987L35.977 30.6145L35.7549 30.8743L34.4547 32.3957L33.6942 30.2714L32.731 27.5807L32.7135 27.5319L32.6252 27.2853L32.4624 26.8306H33.143C33.1541 26.8306 33.1653 26.8306 33.1765 26.8306C33.2621 26.8416 33.3479 26.8547 33.4338 26.8698C35.0025 27.1461 36.2977 28.0596 37.0999 29.2963Z" fill="#121212"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M32.2742 36.2627L32.815 37.7283H32.8735H33.1854C34.9086 37.5058 36.432 36.4752 37.2794 34.9688L37.2805 34.967L36.8491 34.8911L33.4216 34.2875L31.4151 33.9342L31.5455 34.2875L32.2742 36.2627Z" fill="#121212"/>
              <path d="M36.1506 30.7877L33.3875 34.021L34.8618 34.2875L37.3984 34.746C37.6312 34.282 37.8043 33.7714 37.8994 33.2343C37.9345 33.0361 37.9607 32.8032 37.9739 32.6068C38.0416 31.4975 37.7686 30.4294 37.2362 29.5174L36.1506 30.7877Z" fill="#121212"/>
              <path d="M48.75 37.7283L41.1387 30.1348C40.3293 29.3273 39.4098 28.6548 38.4154 28.1319L37.2362 29.5174C37.7686 30.4294 38.0416 31.4975 37.9739 32.6068L43.1075 37.7283H48.75Z" fill="#121212"/>
              <path d="M31.2845 34.2875L30.5006 32.1628L28.9994 33.9209L27.8537 35.2628C28.6559 36.4995 29.9511 37.4131 31.5197 37.6893C31.6046 37.7042 31.6894 37.7171 31.774 37.728C31.8017 37.7282 31.8293 37.7283 31.857 37.7283H32.5539L32.2668 36.9499L31.2845 34.2875Z" fill="#121212"/>
              <path d="M28.8258 33.7477L31.5756 30.5273L30.3586 30.313L28.8465 30.0467L27.5527 29.8189C27.5309 29.8623 27.5097 29.9061 27.489 29.9503C27.2887 30.3777 27.1405 30.838 27.0543 31.3248C27.0189 31.5253 26.9958 31.7102 26.9826 31.9088C26.9084 33.0293 27.181 34.1238 27.7189 35.0441L28.8258 33.7477Z" fill="#121212"/>
              <path d="M31.5306 30.2714L33.5623 30.6291L33.4343 30.2714L32.5012 27.665L32.5011 27.6651L32.2073 26.8684L32.1934 26.8306H32.1694H32.0701H31.7673C30.0467 27.0531 28.5254 28.0816 27.6775 29.5844L29.5012 29.914L31.5306 30.2714Z" fill="#121212"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M16.25 26.8306H21.8925L26.9826 31.9088C26.9084 33.0293 27.181 34.1238 27.7189 35.0441L26.5556 36.4117C25.5724 35.891 24.6628 35.2238 23.8613 34.4241L16.25 26.8306ZM26.7661 36.5203C28.3063 37.2951 30.0181 37.7152 31.774 37.728C31.6894 37.7171 31.6046 37.7042 31.5197 37.6893C29.9511 37.4131 28.6559 36.4995 27.8537 35.2628L26.7661 36.5203Z" fill="#121212"/>
            </svg>
          </button>
          <div class="lens-os-agent-brand">LENS OS</div>
        </div>

        <!-- Panel Body -->
        <div class="lens-os-agent-body">
          <!-- Sidebar (left side) -->
          <div class="lens-os-agent-sidebar ${this.isSidebarOpen ? 'open' : ''}" id="sidebar">
            ${renderSidebar(this.sessions, this.sessionId, this.language)}
          </div>

          <!-- Main Content -->
          <div class="lens-os-agent-main">
            ${mainContent}
          </div>
        </div>
      </div>

      ${renderFAB({
        isOpen: this.isOpen,
        autoMode: this.autoMode,
        language: this.language
      })}

      <style>${getAllStyles()}</style>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // FAB main button
    document.getElementById('fabMain')?.addEventListener('click', () => this.togglePanel());

    // Menu toggle
    document.getElementById('menuToggle')?.addEventListener('click', () => this.toggleSidebar());

    // Send button
    document.getElementById('sendBtn')?.addEventListener('click', () => this.handleSend());

    // Voice button
    document.getElementById('voiceBtn')?.addEventListener('click', () => this.toggleVoiceInput());

    // Textarea enter key (Enter to send, Shift+Enter for new line) and value change
    const input = document.getElementById('chatInput') as HTMLTextAreaElement;
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    input?.addEventListener('input', (e) => {
      const textarea = e.target as HTMLTextAreaElement;
      this.currentInput = textarea.value;
      // Auto-resize textarea
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });

    // Session items
    document.querySelectorAll('[data-session-id]').forEach(el => {
      el.addEventListener('click', () => {
        const sessionId = (el as HTMLElement).dataset.sessionId;
        if (sessionId) this.switchSession(sessionId);
      });
    });

    // Language options
    document.querySelectorAll('[data-lang]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const lang = (e.currentTarget as HTMLElement).dataset.lang;
        if (lang) {
          this.language = lang;
          this.render();
        }
      });
    });

    // Action buttons
    document.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = (e.currentTarget as HTMLElement).dataset.action;
        this.handleAction(action!);
      });
    });

    // Voice button
    const voiceBtn = document.getElementById('voiceBtn');
    if (voiceBtn) {
      voiceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleVoiceInput();
      });
    }

    this.attachInlineToolListeners();
  }

  private attachInlineToolListeners(): void {
    // Inline tool click handlers
    document.querySelectorAll('.lens-os-agent-tool-inline').forEach((el, index) => {
      // Remove existing listener if any
      const newEl = el.cloneNode(true) as HTMLElement;
      el.parentNode?.replaceChild(newEl, el);

      newEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleInlineToolExpand(index);
      });
    });

    // Memory summary click handlers
    document.querySelectorAll('.lens-os-agent-memory-summary .memory-summary-toggle').forEach((toggle) => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const content = toggle.nextElementSibling as HTMLElement;
        if (content && content.classList.contains('memory-summary-content')) {
          const isHidden = content.style.display === 'none';
          content.style.display = isHidden ? 'block' : 'none';
        }
      });
    });
  }

  /**
   * Simple markdown parser
   */
  private parseMarkdown(text: string): string {
    return text
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
      .replace(/^-\s+(.+)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Parse content and convert <tool>...</tool> to inline HTML divs
   */
  private parseContentToHTML(content: string): string {
    let toolIndex = 0;
    let memoryIndex = 0;
    // First escape the content
    let html = escapeHtml(content);

    // Then replace escaped tool tags with actual div elements
    html = html
      .replace(/&lt;tool&gt;([\s\S]*?)&lt;\/tool&gt;/g, () => {
        const placeholderId = `tool-inline-${toolIndex}`;
        toolIndex++;
        return `<div class="lens-os-agent-tool-inline" data-tool-id="${placeholderId}">${t('toolCall', this.language)}</div>`;
      })
      // Replace [Memory Summary] blocks
      .replace(/\[Memory Summary\]\s*([\s\S]*?)(?=&lt;br&gt;&lt;br&gt;\[Memory Summary\]|&lt;br&gt;&lt;br&gt;&lt;tool&gt;|&lt;\/complete&gt;|$)/g, (_match, summaryContent) => {
        const placeholderId = `memory-summary-${memoryIndex}`;
        memoryIndex++;
        const parsedContent = this.parseMarkdown(summaryContent.trim());
        return `<div class="lens-os-agent-memory-summary" data-memory-id="${placeholderId}">
          <div class="memory-summary-toggle">${t('memorySummary', this.language) || 'Memory Summary'}</div>
          <div class="memory-summary-content" style="display:none;">${parsedContent}</div>
        </div>`;
      })
      .replace(/&lt;\/complete&gt;/g, '')
      .replace(/\n/g, '<br>')
      .trim();

    return html;
  }

  /**
   * Parse tool data from XML format to structured object
   */
  private parseToolData(toolData: string): { name: string; params: Record<string, any> } {
    try {
      // Parse format: name: tool_name\nparameters: {...}
      const nameMatch = toolData.match(/name:\s*(.+)/);
      const paramsMatch = toolData.match(/parameters:\s*(\{[\s\S]*\})/);

      const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
      let params: Record<string, any> = {};

      if (paramsMatch) {
        try {
          // Clean up the JSON string - remove trailing commas and whitespace
          const jsonStr = paramsMatch[1].trim();
          params = JSON.parse(jsonStr);
        } catch (e) {
          console.error('Failed to parse tool parameters:', e);
          params = { raw: paramsMatch[1] };
        }
      }

      return { name, params };
    } catch (error) {
      console.error('Failed to parse tool data:', error);
      return { name: 'Unknown', params: {} };
    }
  }

  /**
   * Toggle inline tool expand/collapse
   */
  private toggleInlineToolExpand(toolIndex: number): void {
    const toolSpans = document.querySelectorAll('.lens-os-agent-tool-inline');
    const toolSpan = toolSpans[toolIndex] as HTMLElement;
    if (!toolSpan) return;

    // Get the tool data from the nearest parent message
    const messageEl = toolSpan.closest('.lens-os-agent-message');
    if (!messageEl) return;

    const dataScript = messageEl.querySelector('.inline-tools-data');
    if (!dataScript) return;

    const inlineTools = JSON.parse(dataScript.textContent || '[]');
    const toolData = inlineTools[toolIndex];
    if (!toolData) return;

    // Check if already expanded
    const existingExpanded = toolSpan.nextElementSibling;
    if (existingExpanded && existingExpanded.classList.contains('lens-os-agent-tool-inline-expanded')) {
      // Collapse - remove expanded view
      existingExpanded.remove();
    } else {
      // Expand - create expanded view
      const parsed = this.parseToolData(toolData);
      const expandedDiv = document.createElement('div');
      expandedDiv.className = 'lens-os-agent-tool-inline-expanded';

      // Format parameters as simple list
      const paramsHtml = Object.entries(parsed.params)
        .map(([key, value]) => {
          const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
          return `<div class="param-item"><span class="param-key">${escapeHtml(key)}:</span> <span class="param-value">${escapeHtml(String(displayValue))}</span></div>`;
        })
        .join('');

      expandedDiv.innerHTML = `
        <div class="tool-name-row">${escapeHtml(parsed.name)}</div>
        <div class="params-list">${paramsHtml}</div>
      `;

      // Insert after the tool span
      toolSpan.parentNode?.insertBefore(expandedDiv, toolSpan.nextSibling);

      // Add close button handler
      const closeBtn = expandedDiv.querySelector('.lens-os-agent-tool-inline-header span:last-child');
      closeBtn?.addEventListener('click', () => expandedDiv.remove());
    }
  }

  private async handleAction(action: string): Promise<void> {
    switch (action) {
      case 'refresh':
        this.resetSession();
        break;
      case 'toggle-mode':
        this.autoMode = !this.autoMode;
        await this.render();
        break;
      case 'toggle-language':
        // Toggle to next language
        const languages = ['zh-TW', 'en-US'];
        const currentIndex = languages.indexOf(this.language);
        this.language = languages[(currentIndex + 1) % languages.length];
        await this.render();
        break;
      case 'contact':
        this.mode = 'human-support';
        await this.contactForm.loadFormConfig();
        await this.render();
        break;
      case 'back-to-chat':
        this.mode = 'agent';
        await this.render();
        break;
      case 'submit-contact':
        await this.handleContactSubmit();
        break;
      case 'new-session':
        this.createNewSession();
        break;
    }
  }

  private async handleSend(): Promise<void> {
    const input = document.getElementById('chatInput') as HTMLInputElement;
    if (!input || !this.currentInput.trim()) return;

    this.messages.push({ role: 'user', content: this.currentInput });
    const userMessage = this.currentInput;
    this.currentInput = '';

    // Show thinking animation
    this.isThinking = true;
    this.render();

    setTimeout(() => {
      const messagesArea = document.getElementById('messagesArea');
      if (messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight;
    }, 100);

    try {
      const response = await fetch(`${this.config.apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.config.userId,
          sessionId: this.sessionId,
          message: userMessage,
          autoExecute: this.autoMode,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response stream');

      const assistantMessage: Message = { role: 'assistant', content: '', tools: [] };
      this.messages.push(assistantMessage);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Hide thinking animation on first response
              if (this.isThinking) {
                this.isThinking = false;
                this.render();
              }

              console.log('[AgentPanel] SSE event:', data.type, data);

              if (data.type === 'session_id' && !this.sessionId) {
                this.sessionId = data.sessionId;
                await this.loadSessions();
              } else if (data.type === 'text') {
                // Server sends 'text' type for streaming content
                assistantMessage.content += data.content;

                // 直接更新最後一個 message 的 DOM，保留 HTML 結構
                const messagesArea = document.getElementById('messagesArea');
                if (messagesArea) {
                  const lastMessage = messagesArea.querySelector('.lens-os-agent-message.assistant:last-child .lens-os-agent-message-content');
                  if (lastMessage) {
                    // Parse and convert <tool>...</tool> to inline divs
                    const html = this.parseContentToHTML(assistantMessage.content);
                    lastMessage.innerHTML = html;

                    // Re-attach event listeners for any new inline tools
                    this.attachInlineToolListeners();
                  }
                  messagesArea.scrollTop = messagesArea.scrollHeight;
                }
              } else if (data.type === 'tool_call') {
                console.log('[AgentPanel] Tool call received:', data.toolCall);
                // Add tool call to message for display
                assistantMessage.tools = assistantMessage.tools || [];
                assistantMessage.tools.push({
                  toolCall: data.toolCall,
                  result: null,
                  status: 'pending'
                });
                console.log('[AgentPanel] Tools array:', assistantMessage.tools);
                this.render();

                // Show confirmation if not in auto mode
                if (!this.autoMode) {
                  const confirmed = await this.showToolConfirmation(data.toolCall);
                  if (!confirmed) {
                    reader.cancel();
                    break;
                  }
                }
              } else if (data.type === 'tool_result') {
                console.log('[AgentPanel] Tool result received:', data.toolResult);
                // Update the matching pending tool with result
                if (assistantMessage.tools && assistantMessage.tools.length > 0) {
                  const pendingTool = assistantMessage.tools.find((t: any) => t.status === 'pending');
                  if (pendingTool) {
                    pendingTool.result = data.toolResult;
                    pendingTool.status = 'completed';
                  }
                }
                this.render();
              } else if (data.type === 'done') {
                // Stream complete
                console.log('[AgentPanel] Stream done');
                break;
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('[AgentPanel] Send error:', error);
      alert(t('networkError', this.language));
    }
  }

  private async showToolConfirmation(tool: ToolCall): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmHtml = `
        <div class="lens-os-agent-tool-confirmation" id="toolConfirmation">
          <div class="lens-os-agent-confirmation-content">
            <h3>${t('toolConfirmTitle', this.language)}</h3>
            <p>${t('toolConfirmDesc', this.language)} <strong>${tool.name}</strong></p>
            <pre>${JSON.stringify(tool.parameters, null, 2)}</pre>
            <div class="lens-os-agent-confirmation-buttons">
              <button class="lens-os-agent-confirm-btn deny" id="toolDeny">${t('disagree', this.language)}</button>
              <button class="lens-os-agent-confirm-btn agree" id="toolAgree">${t('agree', this.language)}</button>
            </div>
            <div class="lens-os-agent-custom-input-area">
              <input type="text" placeholder="${t('customInputPlaceholder', this.language)}" id="toolCustomInput">
              <button class="lens-os-agent-confirm-btn custom" id="toolCustom">${t('sendCustom', this.language)}</button>
            </div>
          </div>
        </div>
      `;

      const panel = document.getElementById('lensOsAgentPanel');
      if (panel) {
        panel.insertAdjacentHTML('beforeend', confirmHtml);

        document.getElementById('toolAgree')?.addEventListener('click', () => {
          document.getElementById('toolConfirmation')?.remove();
          resolve(true);
        });

        document.getElementById('toolDeny')?.addEventListener('click', () => {
          document.getElementById('toolConfirmation')?.remove();
          resolve(false);
        });

        document.getElementById('toolCustom')?.addEventListener('click', () => {
          const customInput = (document.getElementById('toolCustomInput') as HTMLInputElement)?.value;
          if (customInput) {
            this.currentInput = customInput;
            this.handleSend();
          }
          document.getElementById('toolConfirmation')?.remove();
          resolve(false);
        });
      }
    });
  }

  private async handleContactSubmit(): Promise<void> {
    try {
      const success = await this.contactForm.handleSubmit(this.config.userId, this.language, this.sessionId);

      if (success) {
        alert(t('submitted', this.language));
        this.mode = 'agent';
        await this.render();
      } else {
        alert(t('fillRequired', this.language));
      }
    } catch (error) {
      console.error('[AgentPanel] Contact submit error:', error);
      alert(t('submitFailed', this.language));
    }
  }

  private async resetSession(): Promise<void> {
    try {
      // Clear all messages in the current session (keep the same session ID)
      if (this.sessionId) {
        const response = await fetch(`${this.config.apiUrl}/api/sessions/${this.sessionId}/messages`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          console.error('[AgentPanel] Failed to clear messages');
        }
      }
    } catch (error) {
      console.error('[AgentPanel] Reset session error:', error);
    }

    // Clear local messages
    this.messages = [];
    this.currentInput = '';
    this.render();
    await this.loadSessions();
  }

  private async loadSessions(): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/sessions/${this.config.userId}?limit=20`);
      if (response.ok) {
        this.sessions = await response.json();
        this.render();
      }
    } catch (error) {
      console.error('[AgentPanel] Load sessions error:', error);
      this.sessions = [];
    }
  }

  private async switchSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/sessions/${sessionId}/messages`);
      if (!response.ok) throw new Error('Failed to load session');

      const messages = await response.json();

      // Find the index of the LAST Memory Summary
      let lastMemorySummaryIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'system' && messages[i].content.startsWith('[Memory Summary]')) {
          lastMemorySummaryIndex = i;
          break;
        }
      }

      // Only show messages from the last Memory Summary onwards
      const visibleMessages = lastMemorySummaryIndex >= 0
        ? messages.slice(lastMemorySummaryIndex)
        : messages;

      this.sessionId = sessionId;
      this.messages = visibleMessages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        tools: msg.toolCalls ? JSON.parse(msg.toolCalls) : undefined,
      }));

      this.mode = 'agent';
      this.isSidebarOpen = false;
      this.render();
    } catch (error) {
      console.error('[AgentPanel] Switch session error:', error);
      alert(t('loadSessionFailed', this.language));
    }
  }

  private async createNewSession(): Promise<void> {
    // Generate a local session ID (will be created in DB on first message)
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.messages = [];
    this.currentInput = '';
    this.mode = 'agent';
    this.isSidebarOpen = false;
    await this.loadSessions();
    this.render();
  }

  /**
   * Toggle voice input on/off
   */
  private toggleVoiceInput(): void {
    if (this.speechRecognition.getIsListening()) {
      // Stop listening
      this.speechRecognition.stop();
      this.render();
    } else {
      // Start listening
      this.speechRecognition.setLanguage(this.language);

      const success = this.speechRecognition.start(
        // On result callback
        (transcript: string) => {
          console.log('[AgentPanel] Voice recognized:', transcript);
          this.currentInput = transcript;
          this.render();

          // Auto-send after 500ms
          setTimeout(() => {
            this.handleSend();
          }, 500);
        },
        // On end callback
        () => {
          console.log('[AgentPanel] Voice recognition ended');
          this.render();
        },
        // On start callback - 當實際開始錄音時更新 UI
        () => {
          console.log('[AgentPanel] Voice recognition actually started');
          this.render();
        }
      );

      if (!success) {
        console.error('[AgentPanel] Failed to start voice recognition');
      }
    }
  }
}
