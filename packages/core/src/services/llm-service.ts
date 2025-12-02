/**
 * Lens Service v3 - LLM Service
 *
 * Unified LLM interface supporting OpenAI and Anthropic
 * 已移除 Azure OpenAI 和 API Key Rotation，改用 OpenAI 官方
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage, AIMessage } from '@langchain/core/messages';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export type LLMProvider = 'openai' | 'anthropic';

export interface LLMConfig {
  provider: LLMProvider;
  openai?: {
    apiKey: string;
    model?: string;
    baseUrl?: string;
  };
  anthropic?: {
    apiKey: string;
    model?: string;
  };
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

export interface LLMServiceOptions {
  provider: LLMProvider;
  config: LLMConfig;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
}

export interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export class LLMService {
  private provider: LLMProvider;
  private config: LLMConfig;
  private chatModel: BaseChatModel | null = null;

  constructor(options: LLMServiceOptions) {
    this.provider = options.provider;
    this.config = options.config;
  }

  /**
   * Initialize or update the chat model
   */
  private initializeChatModel(options: ChatOptions = {}): BaseChatModel {
    switch (this.provider) {
      case 'openai': {
        const openaiConfig = this.config.openai;
        if (!openaiConfig) {
          throw new Error('OpenAI configuration not provided');
        }
        return new ChatOpenAI({
          apiKey: openaiConfig.apiKey,
          modelName: openaiConfig.model || 'gpt-4o',
          temperature: options.temperature ?? this.config.defaultTemperature ?? 0.3,
          maxTokens: options.maxTokens ?? this.config.defaultMaxTokens ?? 4096,
          configuration: openaiConfig.baseUrl
            ? { baseURL: openaiConfig.baseUrl }
            : undefined,
        });
      }

      case 'anthropic': {
        const anthropicConfig = this.config.anthropic;
        if (!anthropicConfig) {
          throw new Error('Anthropic configuration not provided');
        }
        return new ChatAnthropic({
          apiKey: anthropicConfig.apiKey,
          modelName: anthropicConfig.model || 'claude-3-5-sonnet-20241022',
          temperature: options.temperature ?? this.config.defaultTemperature ?? 0.3,
          maxTokens: options.maxTokens ?? this.config.defaultMaxTokens ?? 4096,
        });
      }

      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  /**
   * Send a chat completion request
   */
  async chat(
    messages: BaseMessage[],
    options: ChatOptions = {}
  ): Promise<ChatResponse> {
    // Initialize the model
    this.chatModel = this.initializeChatModel(options);

    // Add system prompt if provided
    const finalMessages = options.systemPrompt
      ? [new SystemMessage(options.systemPrompt), ...messages]
      : messages;

    // Invoke the model
    const response = await this.chatModel.invoke(finalMessages, {
      stop: options.stopSequences,
    });

    // Parse response
    const aiMessage = response as AIMessage;
    const content =
      typeof aiMessage.content === 'string'
        ? aiMessage.content
        : JSON.stringify(aiMessage.content);

    return {
      content,
      usage: aiMessage.usage_metadata
        ? {
            promptTokens: aiMessage.usage_metadata.input_tokens,
            completionTokens: aiMessage.usage_metadata.output_tokens,
            totalTokens: aiMessage.usage_metadata.total_tokens,
          }
        : undefined,
      finishReason: aiMessage.response_metadata?.finish_reason as string | undefined,
    };
  }

  /**
   * Convenience method for simple text chat
   */
  async chatText(
    userMessage: string,
    options: ChatOptions = {}
  ): Promise<string> {
    const response = await this.chat([new HumanMessage(userMessage)], options);
    return response.content;
  }

  /**
   * Get the underlying chat model (for LangGraph integration)
   */
  getChatModel(options: ChatOptions = {}): BaseChatModel {
    if (!this.chatModel) {
      this.chatModel = this.initializeChatModel(options);
    }
    return this.chatModel;
  }

  /**
   * Create a new model instance with specific options
   */
  createModel(options: ChatOptions = {}): BaseChatModel {
    return this.initializeChatModel(options);
  }

  /**
   * Stream chat response
   */
  async *chatStream(
    messages: BaseMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    this.chatModel = this.initializeChatModel(options);

    const finalMessages = options.systemPrompt
      ? [new SystemMessage(options.systemPrompt), ...messages]
      : messages;

    const stream = await this.chatModel.stream(finalMessages, {
      stop: options.stopSequences,
    });

    for await (const chunk of stream) {
      const content =
        typeof chunk.content === 'string'
          ? chunk.content
          : JSON.stringify(chunk.content);
      yield content;
    }
  }

  /**
   * Create LLMService from environment variables
   */
  static fromEnv(): LLMService {
    // Determine provider from env (default to OpenAI)
    const provider = (process.env.LLM_PROVIDER || 'openai') as LLMProvider;

    const config: LLMConfig = {
      provider,
      defaultTemperature: parseFloat(process.env.LLM_TEMPERATURE || '0.3'),
      defaultMaxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4096', 10),
    };

    // Load provider-specific configs
    if (provider === 'openai') {
      config.openai = {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        baseUrl: process.env.OPENAI_BASE_URL,
      };
    } else if (provider === 'anthropic') {
      config.anthropic = {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      };
    }

    return new LLMService({ provider, config });
  }
}

// 全局 LLM Service 實例
let globalLLMService: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!globalLLMService) {
    globalLLMService = LLMService.fromEnv();
  }
  return globalLLMService;
}

export function setLLMService(service: LLMService): void {
  globalLLMService = service;
}
