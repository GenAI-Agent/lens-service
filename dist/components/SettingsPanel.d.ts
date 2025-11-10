/**
 * SettingsPanel - 後台 GUI 設定介面
 *
 * 提供視覺化界面來配置 Agent 功能，包括：
 * - Agent 工具開關
 * - 資料庫連線設定
 * - Telegram 通知設定
 * - 訂單系統配置
 * - 權限管理
 */
import type { ServiceModulerConfig } from '../types';
import type { ConfigManager } from '../agent/ConfigManager';
export interface SettingsPanelOptions {
    configManager: ConfigManager;
    onSave?: (config: ServiceModulerConfig) => void;
    onCancel?: () => void;
}
export declare class SettingsPanel {
    private container;
    private overlay;
    private configManager;
    private onSaveCallback?;
    private onCancelCallback?;
    constructor(options: SettingsPanelOptions);
    private createOverlay;
    private createContainer;
    private renderSettingsHTML;
    private renderToggle;
    private renderInput;
    private bindEvents;
    private handleSave;
    private collectFormData;
    private validateFormData;
    private refreshSettings;
    show(): void;
    hide(): void;
    destroy(): void;
}
