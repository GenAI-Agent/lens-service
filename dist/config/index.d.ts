/**
 * Unified Configuration Service for Lens Service
 *
 * This module provides a centralized configuration management system.
 * All environment variables are validated at startup to prevent runtime errors.
 */
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
export declare const config: {
    /**
     * Base URL for TzAI_web application
     * Browser: Uses current origin
     * Server: Requires NEXT_PUBLIC_BASE_URL environment variable
     */
    readonly baseUrl: string;
    /**
     * Database configuration
     */
    database: {
        readonly url: string;
        readonly host: string;
        readonly port: number;
        readonly name: string;
        readonly user: string;
        readonly password: string;
    };
    /**
     * Azure OpenAI configuration
     */
    azureOpenAI: {
        readonly endpoint: string | undefined;
        readonly apiKey: string | undefined;
        readonly deployment: string | undefined;
        readonly embeddingDeployment: string | undefined;
    };
    /**
     * Telegram configuration (optional)
     */
    telegram: {
        readonly botToken: string | undefined;
        readonly chatId: string | undefined;
    };
    /**
     * Environment
     */
    readonly environment: string;
    readonly isDevelopment: boolean;
    readonly isProduction: boolean;
};
/**
 * Validate all required environment variables
 * Call this at application startup
 */
export declare function validateConfig(): void;
export default config;
