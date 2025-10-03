import { ServiceModulerConfig } from '../types';

/**
 * Azure OpenAI 服務（前端版本）
 * 直接從瀏覽器調用 Azure OpenAI API
 */
export class OpenAIService {
  private endpoint: string;
  private apiKey: string;
  private deployment: string;
  private embeddingDeployment: string;
  private apiVersion: string;
  
  constructor(config: ServiceModulerConfig['azureOpenAI']) {
    if (!config) {
      throw new Error('Azure OpenAI config is required');
    }
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
    this.deployment = config.deployment;
    this.embeddingDeployment = config.embeddingDeployment || 'text-embedding-3-small';
    this.apiVersion = config.apiVersion || '2024-02-15-preview';
  }
  
  /**
   * 生成對話回應（支援文字和圖片）
   */
  async chatCompletion(
    messages: Array<{
      role: string;
      content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>
    }>,
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<string> {
    const url = `${this.endpoint}/openai/deployments/${this.deployment}/chat/completions?api-version=${this.apiVersion}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          messages,
          temperature,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Chat completion error:', error);
      throw error;
    }
  }

  /**
   * 生成對話回應（帶圖片）
   */
  async chatCompletionWithImage(
    text: string,
    imageBase64: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    const messages: any[] = [
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: text
          },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64
            }
          }
        ]
      }
    ];

    return this.chatCompletion(messages, 0.7, 1000);
  }
  
  /**
   * 生成文字的 embedding
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const url = `${this.endpoint}/openai/deployments/${this.embeddingDeployment}/embeddings?api-version=${this.apiVersion}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        body: JSON.stringify({
          input: text
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }
  
  /**
   * 批量生成 embeddings
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // 批量處理，每次最多 16 個
    const batchSize = 16;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.generateEmbedding(text))
      );
      embeddings.push(...batchEmbeddings);
    }
    
    return embeddings;
  }
}

