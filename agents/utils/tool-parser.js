"use strict";
/**
 * Tool Parser
 * Parses streaming LLM output to detect tool calls in <tool></tool> format
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolParser = void 0;
class ToolParser {
    constructor() {
        this.buffer = '';
        this.inToolBlock = false;
        this.toolContent = '';
    }
    /**
     * Add chunk to parser and check if tool call is complete
     */
    addChunk(chunk) {
        this.buffer += chunk;
        // Check if we're entering a tool block
        if (!this.inToolBlock && this.buffer.includes('<tool>')) {
            const beforeTool = this.buffer.substring(0, this.buffer.indexOf('<tool>'));
            this.buffer = this.buffer.substring(this.buffer.indexOf('<tool>') + 6);
            this.inToolBlock = true;
            this.toolContent = '';
            return { text: beforeTool, toolCall: null };
        }
        // Check if we're exiting a tool block
        if (this.inToolBlock && this.buffer.includes('</tool>')) {
            const toolEnd = this.buffer.indexOf('</tool>');
            this.toolContent += this.buffer.substring(0, toolEnd);
            this.buffer = this.buffer.substring(toolEnd + 7);
            this.inToolBlock = false;
            // Parse tool content
            const toolCall = this.parseToolContent(this.toolContent);
            this.toolContent = '';
            return { text: '', toolCall };
        }
        // If in tool block, accumulate content
        if (this.inToolBlock) {
            this.toolContent += this.buffer;
            this.buffer = '';
            return { text: '', toolCall: null };
        }
        // Normal text output
        const text = this.buffer;
        this.buffer = '';
        return { text, toolCall: null };
    }
    /**
     * Parse tool content to extract tool_name and parameters
     */
    parseToolContent(content) {
        try {
            const lines = content.trim().split('\n');
            let toolName = '';
            let parametersJson = '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('tool_name:')) {
                    toolName = trimmed.substring('tool_name:'.length).trim();
                }
                else if (trimmed.startsWith('parameters:')) {
                    parametersJson = trimmed.substring('parameters:'.length).trim();
                }
                else if (parametersJson) {
                    // Multi-line parameters
                    parametersJson += ' ' + trimmed;
                }
            }
            if (!toolName || !parametersJson) {
                console.error('Invalid tool format:', content);
                return null;
            }
            const parameters = JSON.parse(parametersJson);
            return {
                name: toolName,
                parameters,
            };
        }
        catch (error) {
            console.error('Failed to parse tool content:', content, error);
            return null;
        }
    }
    /**
     * Reset parser state
     */
    reset() {
        this.buffer = '';
        this.inToolBlock = false;
        this.toolContent = '';
    }
    /**
     * Get any remaining buffer content
     */
    flush() {
        const remaining = this.buffer;
        this.buffer = '';
        return remaining;
    }
}
exports.ToolParser = ToolParser;
