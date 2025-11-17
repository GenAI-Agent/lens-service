import axios from "axios";
import https from "https";

/**
 * ImageGenerationService
 * 負責與 Flux AI 圖片生成 API 進行交互
 * 基於 API_INTEGRATION_GUIDE.md 實現
 */

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  filenamePrefix?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  promptId: string;
  status: string;
  images?: Array<{
    filename: string;
    subfolder: string;
    type: string;
    url: string;
  }>;
  s3_urls?: Array<string>;
  optimized_prompt?: string;
  error?: string;
}

export class ImageGenerationService {
  private baseUrl: string;
  private timeout: number;
  private httpsAgent: https.Agent;

  constructor(
    baseUrl: string = "https://flux.ask-lens.ai/api/v1",
    timeout: number = 300000,
    rejectUnauthorized: boolean = process.env.NODE_ENV === "production"
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;

    // 在開發環境中允許跳過 SSL 驗證
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: rejectUnauthorized,
    });
  }

  /**
   * 生成書籍封面圖片的優化提示詞
   */
  public createBookCoverPrompt(
    bookTitle: string,
    author?: string,
    description?: string
  ): string {
    let prompt = `Professional book cover design for "${bookTitle}"`;

    if (author) {
      prompt += ` by ${author}`;
    }

    if (description) {
      // 取描述的前100個字元作為風格參考
      const styleHint = description.substring(0, 100);
      prompt += `, style inspired by: ${styleHint}`;
    }

    prompt +=
      ", elegant typography, high quality, professional publishing design, eye-catching, modern aesthetic";

    return prompt;
  }

  /**
   * 生成圖片
   */
  async generateImage(
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResult> {
    try {
      console.log(
        `[Image Generation] Generating image with prompt: ${options.prompt.substring(
          0,
          100
        )}...`
      );

      const payload = {
        prompt_input: options.prompt,
        options: {
          width: options.width,
          height: options.height,
          filename_prefix: options.filenamePrefix,
        },
        wait_for_completion: false,
        upload_to_s3: true,
      };
      console.log(`[Image Generation] Payload: ${JSON.stringify(payload)}`);
      const response = await axios.post(
        `${this.baseUrl}/optimize_generate`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            "Content-Type": "application/json",
          },
          httpsAgent: this.httpsAgent,
        }
      );

      if (response.status === 200 && response.data) {
        const { prompt_id, status, s3_urls } = response.data;

        if (status === "completed" && s3_urls && s3_urls.length > 0) {
          console.log(
            `[Image Generation] Success! Generated ${s3_urls.length} image(s)`
          );

          return {
            success: true,
            promptId: prompt_id,
            status,
            s3_urls,
          };
        } else if (status === "queued" && s3_urls && s3_urls.length > 0) {
          console.log(
            `[Image Generation] Queued! Generated ${s3_urls.length} image(s)`
          );
          return {
            success: true,
            promptId: prompt_id,
            status,
            s3_urls,
          };
        } else {
          console.warn(`[Image Generation] Unexpected status: ${status}`);
          return {
            success: false,
            promptId: prompt_id,
            status,
            error: `Generation status: ${status}`,
          };
        }
      } else {
        return {
          success: false,
          promptId: "",
          status: "error",
          error: `Unexpected response status: ${response.status}`,
        };
      }
    } catch (error: any) {
      console.error("[Image Generation] Failed:", error);

      return {
        success: false,
        promptId: "",
        status: "error",
        error: error.response?.data?.detail || error.message || "Unknown error",
      };
    }
  }

  /**
   * 檢查系統狀態
   */
  async checkSystemStatus(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/system-stats`, {
        timeout: 5000,
        httpsAgent: this.httpsAgent,
      });

      return response.status === 200;
    } catch (error) {
      console.error("[Image Generation] System check failed:", error);
      return false;
    }
  }
}
