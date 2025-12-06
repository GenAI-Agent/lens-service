/**
 * Prompt Builder
 * Assembles complete prompt with all context for LLM
 */

import { Message, PageState, SessionContext } from '../config/types';
import { SYSTEM_PROMPT } from './system-prompt';
import { MemoryManager } from './memory-manager';
import { PromptLoader } from './prompt-loader';

export class PromptBuilder {
  constructor(
    private memoryManager: MemoryManager,
    private promptLoader: PromptLoader
  ) {}

  /**
   * Build complete prompt for LLM
   *
   * Order:
   * 1. System prompt
   * 2. Current page state (text + screenshot) - Fixed Input
   * 3. Site-wide prompts
   * 4. Navigation history
   * 5. Session messages (including compacted summaries)
   * 6. Current user query (already in messages from DB)
   */
  async buildPrompt(context: SessionContext): Promise<Message[]> {
    const messages: Message[] = [];

    // 1. System Prompt
    messages.push({
      role: 'system',
      content: SYSTEM_PROMPT,
    });

    // 2. Current Page State (Fixed Input - never stored in DB)
    if (context.currentPage) {
      console.log('[PromptBuilder] Current page state:', {
        url: context.currentPage.url,
        title: context.currentPage.title,
        hasScreenshot: !!context.currentPage.screenshot,
        markdownLength: context.currentPage.markdown?.length || 0,
        actionableElements: context.currentPage.actionableElements?.length || 0,
      });
      messages.push({
        role: 'system',
        content: this.buildPageStateContent(context.currentPage),
      });
    } else {
      console.log('[PromptBuilder] No current page state provided');
    }

    // 3. Site-wide Prompts
    const sitePrompt = await this.promptLoader.loadSitePrompts();
    console.log('[PromptBuilder] Site prompts loaded:', sitePrompt ? 'Yes' : 'No');
    if (sitePrompt) {
      console.log('[PromptBuilder] Site prompt content:', sitePrompt.substring(0, 100) + '...');
      messages.push({
        role: 'system',
        content: `[Site Information]\n${sitePrompt}`,
      });
    }

    // 4. Navigation History
    const navHistory = await this.promptLoader.loadNavigationHistory(
      context.sessionId,
      5
    );
    if (navHistory) {
      messages.push({
        role: 'system',
        content: navHistory,
      });
    }

    // 6. Session Messages (from DB, includes compacted summaries)
    const sessionMessages = await this.memoryManager.getActiveMessages(
      context.sessionId
    );
    messages.push(...sessionMessages);

    return messages;
  }

  /**
   * Build page state content (multimodal: text + image)
   */
  private buildPageStateContent(page: PageState): Message['content'] {
    const textContent = this.buildPageStateText(page);

    // Return multimodal content if screenshot available
    if (page.screenshot) {
      return [
        {
          type: 'text',
          text: textContent,
        },
        {
          type: 'image_url',
          image_url: {
            url: page.screenshot, // base64 data URL
          },
        },
      ];
    }

    // Text only if no screenshot
    return textContent;
  }

  /**
   * Build page state text description
   */
  private buildPageStateText(page: PageState): string {
    const lines: string[] = [];

    lines.push('[Current Page State]');
    lines.push(`URL: ${page.url}`);
    lines.push(`Title: ${page.title}`);
    lines.push('');
    lines.push('Page Content (Markdown):');
    lines.push(page.markdown);
    lines.push('');

    if (page.actionableElements.length > 0) {
      lines.push('Actionable Elements:');
      for (const el of page.actionableElements) {
        lines.push(`- ${el.description} (selector: ${el.selector})`);
      }
    }

    return lines.join('\n');
  }
}
