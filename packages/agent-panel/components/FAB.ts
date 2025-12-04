/**
 * FAB (Floating Action Button) Component
 */

import { t } from '../i18n';

export interface FABProps {
  isOpen: boolean;
  autoMode: boolean;
  language: string;
}

export function renderFAB({ isOpen, autoMode, language }: FABProps): string {
  return `
    <div class="lens-os-agent-fab-container ${isOpen ? 'panel-open' : ''}" id="fabContainer">
      <!-- Left expanded buttons -->
      <div class="lens-os-agent-fab-expanded left">
        <button class="lens-os-agent-fab-mini" data-tooltip="${t('refresh', language)}" data-action="refresh">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
        <button class="lens-os-agent-fab-mini ${autoMode ? 'active' : ''}" data-tooltip="${t('auto', language)}" data-action="toggle-mode">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </button>
      </div>

      <!-- Main FAB -->
      <button class="lens-os-agent-fab-main" id="fabMain">
        <div class="lens-os-agent-fab-ripple"></div>
        <img src="/widget_icon.svg" class="lens-os-agent-fab-icon" alt="LENS" />
      </button>

      <!-- Right expanded buttons -->
      <div class="lens-os-agent-fab-expanded right">
        <button class="lens-os-agent-fab-mini" data-tooltip="${t('contact', language)}" data-action="contact">
          <!-- Person with headset icon for human support -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
            <path d="M2 17h2a2 2 0 0 1 2 2v1a1 1 0 0 0 1 1h1" />
            <path d="M22 17h-2a2 2 0 0 0-2 2v1a1 1 0 0 1-1 1h-1" />
          </svg>
        </button>
        <!-- Language button wrapper with orbiting options -->
        <div class="lens-os-agent-fab-language-wrapper" id="fabLanguageWrapper">
          <button class="lens-os-agent-fab-mini lens-os-agent-fab-language" data-tooltip="${t('language', language)}" data-action="toggle-language" id="fabLanguage">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </button>
          <!-- Language options orbiting around fab-language center -->
          <button class="lens-os-agent-lang-option ${language === 'zh-TW' ? 'active' : ''}" data-lang="zh-TW" data-position="first">
            <img src="/flags/tw.svg" alt="繁體中文" class="lens-os-agent-flag-icon" />
          </button>
          <button class="lens-os-agent-lang-option ${language === 'en-US' ? 'active' : ''}" data-lang="en-US" data-position="second">
            <img src="/flags/us.svg" alt="English" class="lens-os-agent-flag-icon" />
          </button>
        </div>
      </div>
    </div>
  `;
}
