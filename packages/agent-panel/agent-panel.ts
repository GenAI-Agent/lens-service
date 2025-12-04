/**
 * Lens Agent Panel - Main Entry Point
 */

import { AgentPanelConfig, PanelMode, Session, Message, ToolCall } from './types';
import { t } from './i18n';
import { getAllStyles } from './styles';
import { renderContactForm, renderChatInterface, renderSidebar, renderFAB } from './components';

// Re-export types for external use
export type { ToolCall, ToolResult, PanelMode, Session, AgentPanelConfig } from './types';

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

  constructor(config: AgentPanelConfig) {
    this.container = document.createElement('div');
    this.config = config;
  }

  public mount(container: HTMLElement): void {
    this.container = container;
    this.loadSessions();
    this.render();
  }

  public open(): void {
    this.isOpen = true;
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

  private render(): void {
    const mainContent = this.mode === 'agent'
      ? renderChatInterface(this.messages, this.currentInput, this.language)
      : renderContactForm(this.language);

    this.container.innerHTML = `
      <!-- Glass Panel -->
      <div class="lens-os-agent-panel ${this.isOpen ? 'open' : ''}" id="lensOsAgentPanel">
        <!-- Panel Header -->
        <div class="lens-os-agent-header">
          <button class="lens-os-agent-menu-toggle ${this.isSidebarOpen ? 'active' : ''}" id="menuToggle">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
          </button>
          <div class="lens-os-agent-brand">LENS <span>OS</span></div>
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

      ${renderFAB({ isOpen: this.isOpen, autoMode: this.autoMode, language: this.language })}

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
  }

  private handleAction(action: string): void {
    switch (action) {
      case 'refresh':
        this.resetSession();
        break;
      case 'toggle-mode':
        this.autoMode = !this.autoMode;
        this.render();
        break;
      case 'toggle-language':
        // Toggle to next language
        const languages = ['zh-TW', 'en-US'];
        const currentIndex = languages.indexOf(this.language);
        this.language = languages[(currentIndex + 1) % languages.length];
        this.render();
        break;
      case 'contact':
        this.mode = 'human-support';
        this.render();
        break;
      case 'back-to-chat':
        this.mode = 'agent';
        this.render();
        break;
      case 'submit-contact':
        this.handleContactSubmit();
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

              console.log('[AgentPanel] SSE event:', data.type, data);

              if (data.type === 'session_id' && !this.sessionId) {
                this.sessionId = data.sessionId;
                await this.loadSessions();
              } else if (data.type === 'text') {
                // Server sends 'text' type for streaming content
                assistantMessage.content += data.content;
                this.render();
                setTimeout(() => {
                  const messagesArea = document.getElementById('messagesArea');
                  if (messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight;
                }, 10);
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
    const name = (document.getElementById('contactName') as HTMLInputElement)?.value;
    const email = (document.getElementById('contactEmail') as HTMLInputElement)?.value;
    const type = (document.getElementById('contactType') as HTMLSelectElement)?.value;
    const message = (document.getElementById('contactMessage') as HTMLTextAreaElement)?.value;

    if (!name || !email || !message) {
      alert(t('fillRequired', this.language));
      return;
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.config.userId, name, email, type, message }),
      });

      if (!response.ok) throw new Error('Failed to submit contact form');

      alert(t('submitted', this.language));
      this.mode = 'agent';
      this.render();
    } catch (error) {
      console.error('[AgentPanel] Contact submit error:', error);
      alert(t('submitFailed', this.language));
    }
  }

  private async resetSession(): Promise<void> {
    this.sessionId = '';
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

      this.sessionId = sessionId;
      this.messages = messages.map((msg: any) => ({
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
    this.sessionId = '';
    this.messages = [];
    this.currentInput = '';
    this.mode = 'agent';
    this.isSidebarOpen = false;
    this.render();
  }
}
