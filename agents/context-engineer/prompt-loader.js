"use strict";
/**
 * Prompt Loader
 * Loads site-wide and URL-specific prompts from database
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptLoader = void 0;
class PromptLoader {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Load site-wide prompts
     * Returns all active global prompts concatenated
     */
    async loadSitePrompts() {
        const prompts = await this.prisma.sitePrompt.findMany({
            where: {
                isGlobal: true,
                isActive: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        if (prompts.length === 0) {
            return null;
        }
        return prompts.map((p) => p.prompt).join('\n\n');
    }
    /**
     * Load URL-specific prompt matching the current URL
     * Uses pattern matching (supports wildcards)
     */
    async loadUrlPrompt(currentUrl) {
        try {
            const url = new URL(currentUrl);
            const pathname = url.pathname;
            const urlPrompts = await this.prisma.urlPathPrompt.findMany({
                where: {
                    isActive: true,
                },
                orderBy: {
                    priority: 'desc', // Higher priority first
                },
            });
            // Find first matching pattern
            for (const prompt of urlPrompts) {
                if (this.matchesPattern(pathname, prompt.urlPattern)) {
                    return prompt.prompt;
                }
            }
            return null;
        }
        catch (error) {
            console.error('Failed to parse URL or load URL prompts:', error);
            return null;
        }
    }
    /**
     * Match pathname against pattern
     * Supports wildcards: /products/* matches /products/123
     */
    matchesPattern(pathname, pattern) {
        // Exact match
        if (pathname === pattern) {
            return true;
        }
        // Wildcard match
        if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
            return regex.test(pathname);
        }
        return false;
    }
    /**
     * Load navigation history summary for a session
     */
    async loadNavigationHistory(sessionId, limit = 5) {
        const history = await this.prisma.navigationHistory.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
        if (history.length === 0) {
            return null;
        }
        const lines = history.reverse().map((h) => {
            const url = h.url;
            const summary = h.summary || 'Visited page';
            return `- ${url}: ${summary}`;
        });
        return `Recent Navigation:\n${lines.join('\n')}`;
    }
    /**
     * Save navigation entry
     */
    async saveNavigation(sessionId, url, summary) {
        await this.prisma.navigationHistory.create({
            data: {
                sessionId,
                url,
                summary,
            },
        });
    }
}
exports.PromptLoader = PromptLoader;
