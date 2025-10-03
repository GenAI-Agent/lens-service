/**
 * Plugin 註冊中心
 * 統一管理所有搜尋 Plugin
 */

export type { SearchPlugin } from './SearchPlugin';
export { PluginManager } from './SearchPlugin';
export { ManualIndexPlugin } from './ManualIndexPlugin';
export { FrontendPagePlugin } from './FrontendPagePlugin';
export { SitemapPlugin } from './SitemapPlugin';
export { SQLPlugin, createSQLPlugin, saveSQLPluginConfig } from './SQLPlugin';
export type { SQLPluginConfig } from './SQLPlugin';

import { PluginManager } from './SearchPlugin';
import { ManualIndexPlugin } from './ManualIndexPlugin';
import { FrontendPagePlugin } from './FrontendPagePlugin';
import { SitemapPlugin } from './SitemapPlugin';
import { createSQLPlugin } from './SQLPlugin';

/**
 * 創建並初始化預設的 Plugin Manager
 */
export function createDefaultPluginManager(): PluginManager {
  const manager = new PluginManager();

  // 註冊所有內建 Plugin
  manager.register(new ManualIndexPlugin());
  manager.register(new FrontendPagePlugin());
  manager.register(new SitemapPlugin());
  manager.register(createSQLPlugin());

  return manager;
}

/**
 * 從 localStorage 載入 Plugin 配置
 */
export function loadPluginConfigs(manager: PluginManager): void {
  const savedConfigs = localStorage.getItem('sm_plugin_configs');
  if (!savedConfigs) return;

  try {
    const configs = JSON.parse(savedConfigs);

    Object.keys(configs).forEach(pluginId => {
      const plugin = manager.getPlugin(pluginId);
      if (plugin) {
        plugin.updateConfig(configs[pluginId]);
      }
    });

    console.log('✅ Plugin configs loaded from localStorage');
  } catch (error) {
    console.error('Error loading plugin configs:', error);
  }
}

/**
 * 保存 Plugin 配置到 localStorage
 */
export function savePluginConfigs(manager: PluginManager): void {
  const configs: Record<string, any> = {};

  manager.getAllPlugins().forEach(plugin => {
    configs[plugin.id] = plugin.getConfig();
  });

  localStorage.setItem('sm_plugin_configs', JSON.stringify(configs));
  console.log('✅ Plugin configs saved to localStorage');
}

