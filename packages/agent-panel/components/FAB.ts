/**
 * FAB (Floating Action Button) Component
 */

import { t } from '../i18n';

export interface FABProps {
  isOpen: boolean;
  autoMode: boolean;
  language: string;
  isVoiceMode?: boolean;
  isListening?: boolean;
}

export function renderFAB({ isOpen, autoMode, language, isVoiceMode = false, isListening = false }: FABProps): string {
  // Microphone icon for voice mode
  const microphoneIcon = `
    <svg class="lens-os-agent-fab-icon lens-os-agent-fab-mic-icon ${isListening ? 'listening' : ''}" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  `;

  // Logo icon for normal mode
  const logoIcon = `
    <svg class="lens-os-agent-fab-icon" width="65" height="64" viewBox="0 0 65 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.6501 26.8306L24.9088 29.084L27.6775 29.5844C28.5254 28.0816 30.0467 27.0531 31.7673 26.8306H22.6501Z" fill="#121212"/>
      <path d="M42.3499 37.7283L40.0938 35.4775L37.2794 34.9688C36.432 36.4752 34.9086 37.5058 33.1854 37.7283H42.3499Z" fill="#121212"/>
      <path d="M33.1765 26.8306C33.2621 26.8416 33.3479 26.8547 33.4338 26.8698C35.0025 27.1461 36.2977 28.0596 37.0999 29.2963L38.1911 28.0171C36.6474 27.2489 34.9334 26.8358 33.1765 26.8306Z" fill="#121212"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M37.0999 29.2963L37.1014 29.2987L35.977 30.6145L35.7549 30.8743L34.4547 32.3957L33.6942 30.2714L32.731 27.5807L32.7135 27.5319L32.6252 27.2853L32.4624 26.8306H33.143C33.1541 26.8306 33.1653 26.8306 33.1765 26.8306C33.2621 26.8416 33.3479 26.8547 33.4338 26.8698C35.0025 27.1461 36.2977 28.0596 37.0999 29.2963Z" fill="#121212"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M32.2742 36.2627L32.815 37.7283H32.8735H33.1854C34.9086 37.5058 36.432 36.4752 37.2794 34.9688L37.2805 34.967L36.8491 34.8911L33.4216 34.2875L31.4151 33.9342L31.5455 34.2875L32.2742 36.2627Z" fill="#121212"/>
      <path d="M36.1506 30.7877L33.3875 34.021L34.8618 34.2875L37.3984 34.746C37.6312 34.282 37.8043 33.7714 37.8994 33.2343C37.9345 33.0361 37.9607 32.8032 37.9739 32.6068C38.0416 31.4975 37.7686 30.4294 37.2362 29.5174L36.1506 30.7877Z" fill="#121212"/>
      <path d="M48.75 37.7283L41.1387 30.1348C40.3293 29.3273 39.4098 28.6548 38.4154 28.1319L37.2362 29.5174C37.7686 30.4294 38.0416 31.4975 37.9739 32.6068L43.1075 37.7283H48.75Z" fill="#121212"/>
      <path d="M31.2845 34.2875L30.5006 32.1628L28.9994 33.9209L27.8537 35.2628C28.6559 36.4995 29.9511 37.4131 31.5197 37.6893C31.6046 37.7042 31.6894 37.7171 31.774 37.728C31.8017 37.7282 31.8293 37.7283 31.857 37.7283H32.5539L32.2668 36.9499L31.2845 34.2875Z" fill="#121212"/>
      <path d="M28.8258 33.7477L31.5756 30.5273L30.3586 30.313L28.8465 30.0467L27.5527 29.8189C27.5309 29.8623 27.5097 29.9061 27.489 29.9503C27.2887 30.3777 27.1405 30.838 27.0543 31.3248C27.0189 31.5253 26.9958 31.7102 26.9826 31.9088C26.9084 33.0293 27.181 34.1238 27.7189 35.0441L28.8258 33.7477Z" fill="#121212"/>
      <path d="M31.5306 30.2714L33.5623 30.6291L33.4343 30.2714L32.5012 27.665L32.5011 27.6651L32.2073 26.8684L32.1934 26.8306H32.1694H32.0701H31.7673C30.0467 27.0531 28.5254 28.0816 27.6775 29.5844L29.5012 29.914L31.5306 30.2714Z" fill="#121212"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M16.25 26.8306H21.8925L26.9826 31.9088C26.9084 33.0293 27.181 34.1238 27.7189 35.0441L26.5556 36.4117C25.5724 35.891 24.6628 35.2238 23.8613 34.4241L16.25 26.8306ZM26.7661 36.5203C28.3063 37.2951 30.0181 37.7152 31.774 37.728C31.6894 37.7171 31.6046 37.7042 31.5197 37.6893C29.9511 37.4131 28.6559 36.4995 27.8537 35.2628L26.7661 36.5203Z" fill="#121212"/>
    </svg>
  `;

  return `
    <div class="lens-os-agent-fab-container ${isOpen ? 'panel-open' : ''} ${isVoiceMode ? 'voice-mode' : ''}" id="fabContainer">
      <!-- Voice hint animation (shown on first open) -->
      <div class="lens-os-agent-voice-hint" id="voiceHint">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
        <div class="lens-os-agent-voice-hint-text">
          ${language === 'zh-TW' ? '按住往上拖動啟用語音' : 'Hold & drag up for voice'}
        </div>
      </div>

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
      <button class="lens-os-agent-fab-main ${isVoiceMode ? 'voice-mode' : ''} ${isListening ? 'listening' : ''}" id="fabMain">
        <div class="lens-os-agent-fab-ripple"></div>
        ${isVoiceMode ? microphoneIcon : logoIcon}
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
