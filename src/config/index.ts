/**
 * Unified Configuration Service for Lens Service
 *
 * This module provides a centralized configuration management system.
 * All environment variables are validated at startup to prevent runtime errors.
 */

/**
 * Get required environment variable
 * @throws Error if environment variable is not set
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get optional environment variable with default value
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Configuration object
 *
 * For browser environments:
 * - BASE_URL and API_URL use window.location.origin
 *
 * For server environments:
 * - All URLs must be provided via environment variables
 * - No localhost fallbacks are allowed
 */
export const config = {
  /**
   * Base URL for TzAI_web application
   * Browser: Uses current origin
   * Server: Requires NEXT_PUBLIC_BASE_URL environment variable
   */
  get baseUrl(): string {
    if (isBrowser()) {
      return window.location.origin;
    }
    return getRequiredEnv("NEXT_PUBLIC_BASE_URL");
  },

  /**
   * Database configuration
   */
  database: {
    get url(): string {
      return getRequiredEnv("DATABASE_URL");
    },
    get host(): string {
      return getRequiredEnv("DB_HOST");
    },
    get port(): number {
      return parseInt(getOptionalEnv("DB_PORT", "5432"), 10);
    },
    get name(): string {
      return getRequiredEnv("DB_NAME");
    },
    get user(): string {
      return getRequiredEnv("DB_USER");
    },
    get password(): string {
      return getRequiredEnv("DB_PASSWORD");
    },
  },

  /**
   * Azure OpenAI configuration
   */
  azureOpenAI: {
    get endpoint(): string | undefined {
      return process.env.AZURE_OPENAI_ENDPOINT;
    },
    get apiKey(): string | undefined {
      return process.env.AZURE_OPENAI_API_KEY;
    },
    get deployment(): string | undefined {
      return process.env.AZURE_OPENAI_DEPLOYMENT;
    },
    get embeddingDeployment(): string | undefined {
      return process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT;
    },
  },

  /**
   * Telegram configuration (optional)
   */
  telegram: {
    get botToken(): string | undefined {
      return process.env.TELEGRAM_BOT_TOKEN;
    },
    get chatId(): string | undefined {
      return process.env.TELEGRAM_CHAT_ID;
    },
  },

  /**
   * Environment
   */
  get environment(): string {
    return getOptionalEnv("NODE_ENV", "development");
  },

  get isDevelopment(): boolean {
    return this.environment === "development";
  },

  get isProduction(): boolean {
    return this.environment === "production";
  },
};

/**
 * Validate all required environment variables
 * Call this at application startup
 */
export function validateConfig(): void {
  const errors: string[] = [];

  try {
    // Only validate server-side configs when not in browser
    if (!isBrowser()) {
      // Required for server-side operations
      if (!process.env.NEXT_PUBLIC_BASE_URL) {
        errors.push(
          "NEXT_PUBLIC_BASE_URL is required for server-side operations"
        );
      }
    }

    // Database is always required (server-side only)
    if (!isBrowser()) {
      if (!process.env.DATABASE_URL) {
        errors.push("DATABASE_URL is required");
      }
      if (!process.env.DB_HOST) {
        errors.push("DB_HOST is required");
      }
      if (!process.env.DB_NAME) {
        errors.push("DB_NAME is required");
      }
      if (!process.env.DB_USER) {
        errors.push("DB_USER is required");
      }
      if (!process.env.DB_PASSWORD) {
        errors.push("DB_PASSWORD is required");
      }
    }

    if (errors.length > 0) {
      throw new Error(
        `Configuration validation failed:\n${errors
          .map((e) => `  - ${e}`)
          .join("\n")}`
      );
    }

    console.log("✅ Configuration validated successfully");
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Configuration validation failed:", error.message);
      throw error;
    }
    throw error;
  }
}

export default config;
