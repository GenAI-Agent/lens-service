import axios from "axios";

/**
 * ImageGenerationService
 * 負責與 Flux AI 圖片生成 API 進行交互
 * 基於 API_INTEGRATION_GUIDE.md 實現
 */

export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  guidance?: number;
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

  constructor(
    baseUrl: string = "https://flux.ask-lens.ai/api/v1",
    timeout: number = 300000
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * 創建工作流 JSON
   * 根據參數生成 ComfyUI 工作流配置
   */
  private createWorkflow(options: ImageGenerationOptions): any {
    const {
      prompt,
      width = 1024,
      height = 1024,
      steps = 20,
      seed = Math.floor(Math.random() * 1000000),
      guidance = 3.5,
      filenamePrefix = "aipage_book_cover",
    } = options;

    return {
      "6": {
        inputs: {
          text: prompt,
          clip: ["30", 1],
        },
        class_type: "CLIPTextEncode",
      },
      "27": {
        inputs: {
          width: width,
          height: height,
          batch_size: 1,
        },
        class_type: "EmptySD3LatentImage",
      },
      "30": {
        inputs: {
          ckpt_name: "flux1-dev-fp8.safetensors",
        },
        class_type: "CheckpointLoaderSimple",
      },
      "31": {
        inputs: {
          seed: seed,
          steps: steps,
          cfg: 1.0,
          sampler_name: "euler",
          scheduler: "simple",
          denoise: 1.0,
          model: ["30", 0],
          positive: ["35", 0],
          negative: ["33", 0],
          latent_image: ["27", 0],
        },
        class_type: "KSampler",
      },
      "33": {
        inputs: {
          text: "",
          clip: ["30", 1],
        },
        class_type: "CLIPTextEncode",
      },
      "35": {
        inputs: {
          guidance: guidance,
          conditioning: ["6", 0],
        },
        class_type: "FluxGuidance",
      },
      "8": {
        inputs: {
          samples: ["31", 0],
          vae: ["30", 2],
        },
        class_type: "VAEDecode",
      },
      "9": {
        inputs: {
          filename_prefix: filenamePrefix,
          extension: "png",
          images: ["8", 0],
        },
        class_type: "SaveImage",
      },
    };
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

      const workflow = this.createWorkflow(options);
      const payload = {
        workflow,
        wait_for_completion: false,
        upload_to_s3: true,
        prompt_input: options.prompt,
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
   * 批量生成多個書籍封面
   */
  async generateBookCovers(
    books: Array<{
      book_id: string;
      title: string;
      author?: string;
      description?: string;
    }>
  ): Promise<Map<string, string>> {
    console.log(
      `[Image Generation] Batch generating ${books.length} book covers`
    );

    const results = new Map<string, string>();

    // 並行生成圖片（限制並發數量避免過載）
    const concurrency = 3;
    for (let i = 0; i < books.length; i += concurrency) {
      const batch = books.slice(i, i + concurrency);

      const promises = batch.map(async (book) => {
        const prompt = this.createBookCoverPrompt(
          book.title,
          book.author,
          book.description
        );

        const result = await this.generateImage({
          prompt,
          width: 512,
          height: 768,
          steps: 15, // 快速生成模式
          filenamePrefix: `book_cover/${book.book_id}`,
        });

        if (result.success && result.s3_urls && result.s3_urls.length > 0) {
          return { bookId: book.book_id, imageUrl: result.s3_urls[0] };
        } else {
          console.warn(
            `[Image Generation] Failed to generate cover for book ${book.book_id}: ${result.error}`
          );
          return { bookId: book.book_id, imageUrl: null };
        }
      });

      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value.imageUrl) {
          results.set(result.value.bookId, result.value.imageUrl);
        }
      });

      // 避免過快請求
      if (i + concurrency < books.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `[Image Generation] Batch complete: ${results.size}/${books.length} successful`
    );

    return results;
  }

  /**
   * 檢查系統狀態
   */
  async checkSystemStatus(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/system-stats`, {
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      console.error("[Image Generation] System check failed:", error);
      return false;
    }
  }
}
