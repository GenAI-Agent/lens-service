"use strict";
/**
 * Prompt Builder
 * Assembles complete prompt with all context for LLM
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptBuilder = void 0;
const system_prompt_1 = require("./system-prompt");
class PromptBuilder {
    constructor(memoryManager, promptLoader) {
        this.memoryManager = memoryManager;
        this.promptLoader = promptLoader;
    }
    /**
     * Build complete prompt for LLM
     *
     * Order:
     * 1. System prompt
     * 2. Current page state (text + screenshot) - Fixed Input
     * 3. Site-wide prompts
     * 4. URL-specific prompts
     * 5. Navigation history
     * 6. Session messages (including compacted summaries)
     * 7. Current user query (already in messages from DB)
     */
    async buildPrompt(context) {
        const messages = [];
        // 1. System Prompt
        messages.push({
            role: 'system',
            content: system_prompt_1.SYSTEM_PROMPT,
        });
        // 2. Current Page State (Fixed Input - never stored in DB)
        if (context.currentPage) {
            messages.push({
                role: 'system',
                content: this.buildPageStateContent(context.currentPage),
            });
        }
        // 3. Site-wide Prompts
        const sitePrompt = await this.promptLoader.loadSitePrompts();
        if (sitePrompt) {
            messages.push({
                role: 'system',
                content: `[Site Information]\n${sitePrompt}`,
            });
        }
        // 4. URL-specific Prompts
        const urlPrompt = await this.promptLoader.loadUrlPrompt(context.currentUrl);
        if (urlPrompt) {
            messages.push({
                role: 'system',
                content: `[Page Type Information]\n${urlPrompt}`,
            });
        }
        // 5. Navigation History
        const navHistory = await this.promptLoader.loadNavigationHistory(context.sessionId, 5);
        if (navHistory) {
            messages.push({
                role: 'system',
                content: navHistory,
            });
        }
        // 6. Session Messages (from DB, includes compacted summaries)
        const sessionMessages = await this.memoryManager.getActiveMessages(context.sessionId);
        messages.push(...sessionMessages);
        return messages;
    }
    /**
     * Build page state content (multimodal: text + image)
     */
    buildPageStateContent(page) {
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
    buildPageStateText(page) {
        const lines = [];
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
exports.PromptBuilder = PromptBuilder;
