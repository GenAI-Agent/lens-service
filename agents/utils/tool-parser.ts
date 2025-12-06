/**
 * Tool Parser
 * Parses streaming LLM output to detect tool calls in <tool><call></call></tool> format
 */

import { ToolCall } from '../config/types';

export class ToolParser {
  private buffer: string = '';
  private inToolBlock: boolean = false;
  private toolContent: string = '';

  /**
   * Add chunk to parser and check if tool block is complete
   */
  addChunk(chunk: string): { text: string; toolCalls: ToolCall[] } {
    this.buffer += chunk;

    // Check if we're entering a tool block
    if (!this.inToolBlock && this.buffer.includes('<tool>')) {
      const beforeTool = this.buffer.substring(0, this.buffer.indexOf('<tool>'));
      this.buffer = this.buffer.substring(this.buffer.indexOf('<tool>') + 6);
      this.inToolBlock = true;
      this.toolContent = '';

      return { text: beforeTool, toolCalls: [] };
    }

    // Check if we're exiting a tool block
    if (this.inToolBlock && this.buffer.includes('</tool>')) {
      const toolEnd = this.buffer.indexOf('</tool>');
      this.toolContent += this.buffer.substring(0, toolEnd);
      this.buffer = this.buffer.substring(toolEnd + 7);
      this.inToolBlock = false;

      // Parse all <call> blocks inside <tool>
      const toolCalls = this.parseToolContent(this.toolContent);
      this.toolContent = '';

      return { text: '', toolCalls };
    }

    // If in tool block, accumulate content
    if (this.inToolBlock) {
      this.toolContent += this.buffer;
      this.buffer = '';
      return { text: '', toolCalls: [] };
    }

    // Otherwise, return all buffer as text
    const text = this.buffer;
    this.buffer = '';
    return { text, toolCalls: [] };
  }

  /**
   * Parse tool content to extract tool call (simplified format)
   * Format: name: tool_name\nparameters: {json}
   */
  private parseToolContent(content: string): ToolCall[] {
    try {
      const lines = content.trim().split('\n');
      let toolName = '';
      let parametersJson = '';

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('name:')) {
          toolName = trimmed.substring('name:'.length).trim();
        } else if (trimmed.startsWith('parameters:')) {
          parametersJson = trimmed.substring('parameters:'.length).trim();
        } else if (parametersJson) {
          // Multi-line parameters
          parametersJson += ' ' + trimmed;
        }
      }

      if (!toolName || !parametersJson) {
        console.error('Invalid tool format:', content);
        return [];
      }

      const parameters = JSON.parse(parametersJson);

      return [{
        name: toolName,
        parameters,
      }];
    } catch (error) {
      console.error('Failed to parse tool content:', content, error);
      return [];
    }
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.buffer = '';
    this.inToolBlock = false;
    this.toolContent = '';
  }

  /**
   * Get any remaining buffer content
   */
  flush(): string {
    const remaining = this.buffer;
    this.buffer = '';
    return remaining;
  }
}
