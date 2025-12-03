"use strict";
/**
 * Memory Manager
 * Manages session messages in database with automatic memory compaction
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
const openai_1 = __importDefault(require("openai"));
class MemoryManager {
    constructor(prisma, openaiApiKey) {
        this.prisma = prisma;
        this.openai = new openai_1.default({ apiKey: openaiApiKey });
    }
    /**
     * Get active messages (not archived) from database
     */
    async getActiveMessages(sessionId) {
        const messages = await this.prisma.message.findMany({
            where: {
                sessionId,
                archived: false,
            },
            orderBy: {
                timestamp: 'asc',
            },
            select: {
                id: true,
                role: true,
                content: true,
                timestamp: true,
                archived: true,
                isCompacted: true,
            },
        });
        return messages.map((m) => ({
            role: m.role,
            content: m.content,
        }));
    }
    /**
     * Save a new message to database
     */
    async saveMessage(sessionId, role, content) {
        await this.prisma.message.create({
            data: {
                sessionId,
                role,
                content,
                archived: false,
                isCompacted: false,
            },
        });
    }
    /**
     * Check if memory compact is needed
     * Triggers when active messages > 20 or estimated tokens > 8000
     */
    async shouldCompact(sessionId) {
        const activeMessages = await this.prisma.message.count({
            where: {
                sessionId,
                archived: false,
            },
        });
        if (activeMessages < 15) {
            return false;
        }
        const messages = await this.getActiveMessages(sessionId);
        const estimatedTokens = this.estimateTokens(messages);
        return activeMessages > 20 || estimatedTokens > 8000;
    }
    /**
     * Compact old messages into a summary
     * Keep recent 10 messages, compact the rest
     */
    async compactMemory(sessionId) {
        const messages = await this.prisma.message.findMany({
            where: {
                sessionId,
                archived: false,
                isCompacted: false, // Don't compact already compacted messages
            },
            orderBy: {
                timestamp: 'asc',
            },
        });
        if (messages.length < 15) {
            console.log('Not enough messages to compact');
            return;
        }
        // Keep recent 10 messages, compact the rest
        const keepCount = 10;
        const toCompact = messages.slice(0, -keepCount);
        if (toCompact.length === 0) {
            return;
        }
        // Generate summary using LLM
        const summary = await this.generateSummary(toCompact);
        // Archive old messages
        await this.prisma.message.updateMany({
            where: {
                id: {
                    in: toCompact.map((m) => m.id),
                },
            },
            data: {
                archived: true,
            },
        });
        // Create compacted summary message
        await this.prisma.message.create({
            data: {
                sessionId,
                role: 'system',
                content: `[Memory Summary]\n${summary}`,
                isCompacted: true,
                compactedFromId: toCompact[0].id,
                compactedToId: toCompact[toCompact.length - 1].id,
                archived: false,
            },
        });
        console.log(`Compacted ${toCompact.length} messages into summary for session ${sessionId}`);
    }
    /**
     * Generate summary of messages using LLM
     */
    async generateSummary(messages) {
        const conversationText = messages
            .map((m) => `${m.role}: ${m.content}`)
            .join('\n\n');
        const response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Summarize the following conversation concisely. Focus on:
- Key topics discussed
- Important information exchanged
- User's requests and agent's responses
- Any actions taken

Keep it under 300 words.`,
                },
                {
                    role: 'user',
                    content: conversationText,
                },
            ],
            temperature: 0.3,
        });
        return response.choices[0]?.message?.content || 'Summary unavailable';
    }
    /**
     * Estimate token count for messages (rough approximation)
     */
    estimateTokens(messages) {
        let total = 0;
        for (const msg of messages) {
            if (typeof msg.content === 'string') {
                // Rough estimate: 1 token ≈ 4 characters
                total += Math.ceil(msg.content.length / 4);
            }
            else if (Array.isArray(msg.content)) {
                for (const part of msg.content) {
                    if (part.type === 'text' && part.text) {
                        total += Math.ceil(part.text.length / 4);
                    }
                    else if (part.type === 'image_url') {
                        // Images cost fixed tokens (depends on size, ~85-255 tokens for low detail)
                        total += 85;
                    }
                }
            }
        }
        return total;
    }
    /**
     * Clear all messages for a session (for testing)
     */
    async clearSession(sessionId) {
        await this.prisma.message.deleteMany({
            where: { sessionId },
        });
    }
}
exports.MemoryManager = MemoryManager;
