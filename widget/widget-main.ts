/**
 * Widget Main Entry
 * Handles UI interactions and communication with backend
 */

import { WebUseService, PageState } from './web-use-service';

class LensWidget {
  private webUseService: WebUseService;
  private apiUrl: string;
  private sessionId: string | null = null;
  private isOpen = false;
  private isProcessing = false;

  constructor() {
    this.webUseService = new WebUseService();
    // Check for window.LENS_CONFIG first (for embedded usage), fallback to default
    this.apiUrl = (window as any).LENS_CONFIG?.apiUrl || 'http://localhost:3002';
    this.init();
  }

  private init(): void {
    const button = document.getElementById('lens-widget-button');
    const closeBtn = document.querySelector('.widget-close');
    const sendBtn = document.getElementById('widget-send');
    const input = document.getElementById('widget-input') as HTMLInputElement;

    button?.addEventListener('click', () => this.toggleChat());
    closeBtn?.addEventListener('click', () => this.toggleChat());
    sendBtn?.addEventListener('click', () => this.sendMessage());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.isProcessing) {
        this.sendMessage();
      }
    });
  }

  private toggleChat(): void {
    const chat = document.getElementById('lens-widget-chat');
    if (chat) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        chat.classList.add('open');
      } else {
        chat.classList.remove('open');
      }
    }
  }

  private async sendMessage(): Promise<void> {
    if (this.isProcessing) return;

    const input = document.getElementById('widget-input') as HTMLInputElement;
    const message = input.value.trim();

    if (!message) return;

    this.addMessage('user', message);
    input.value = '';
    this.isProcessing = true;
    this.updateSendButton(true);

    try {
      // Analyze current page
      const pageState = await this.webUseService.analyzePage();

      // Send to backend API
      await this.streamChat(message, pageState);
    } catch (error) {
      console.error('Send message error:', error);
      this.addMessage('system', 'Error: Failed to send message');
    } finally {
      this.isProcessing = false;
      this.updateSendButton(false);
    }
  }

  private async streamChat(message: string, pageState: PageState): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        userId: (window as any).LENS_CONFIG?.userId || 'anonymous',
        message,
        currentUrl: pageState.url,
        currentPage: pageState,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Save session ID
    const sessionIdHeader = response.headers.get('X-Session-Id');
    if (sessionIdHeader) {
      this.sessionId = sessionIdHeader;
    }

    // Stream response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let assistantMessage = '';
    let assistantMessageElement: HTMLElement | null = null;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6).trim();

          if (data === '[DONE]') {
            break;
          }

          try {
            const event = JSON.parse(data);

            if (event.type === 'text') {
              assistantMessage += event.content;

              // Create or update assistant message element
              if (!assistantMessageElement) {
                assistantMessageElement = this.addMessage('assistant', '');
              }
              assistantMessageElement.textContent = assistantMessage;
              this.scrollToBottom();
            } else if (event.type === 'tool_call') {
              this.addMessage('system', `Calling tool: ${event.toolCall.name}`);
            } else if (event.type === 'tool_result') {
              if (event.toolResult.success) {
                // Handle web use actions
                if (event.toolCall.name === 'web_use') {
                  await this.handleWebUseAction(event.toolCall.parameters);
                }
              }
            } else if (event.type === 'error') {
              this.addMessage('system', `Error: ${event.error}`);
            }
          } catch (error) {
            console.error('Parse SSE error:', error);
          }
        }
      }
    }
  }

  private async handleWebUseAction(params: any): Promise<void> {
    const { action } = params;

    switch (action) {
      case 'click':
        await this.webUseService.click(params.selector);
        break;
      case 'doubleClick':
        await this.webUseService.doubleClick(params.selector);
        break;
      case 'scroll':
        await this.webUseService.scroll(params);
        break;
      case 'scrollToElement':
        await this.webUseService.scrollToElement(params.selector);
        break;
      case 'highlight':
        await this.webUseService.highlight(params);
        break;
      case 'drag':
        await this.webUseService.drag(params);
        break;
      case 'deepCrawl':
        await this.webUseService.deepCrawl(params);
        break;
    }
  }

  private addMessage(role: 'user' | 'assistant' | 'system', content: string): HTMLElement {
    const messagesContainer = document.getElementById('widget-messages');
    if (!messagesContainer) {
      throw new Error('Messages container not found');
    }

    const messageEl = document.createElement('div');
    messageEl.className = `message ${role}`;
    messageEl.textContent = content;

    messagesContainer.appendChild(messageEl);
    this.scrollToBottom();

    return messageEl;
  }

  private scrollToBottom(): void {
    const messagesContainer = document.getElementById('widget-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private updateSendButton(disabled: boolean): void {
    const sendBtn = document.getElementById('widget-send') as HTMLButtonElement;
    if (sendBtn) {
      sendBtn.disabled = disabled;
      sendBtn.textContent = disabled ? 'Sending...' : 'Send';
    }
  }
}

// Initialize widget when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LensWidget();
  });
} else {
  new LensWidget();
}
