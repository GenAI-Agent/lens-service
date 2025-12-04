/**
 * Sidebar Component
 */

import { t } from '../i18n';
import { Session } from '../types';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncateText(text: string, maxLength: number = 20): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.substring(0, maxLength) + '...';
}

function getSessionDisplayText(session: Session, language: string): string {
  if (session.lastMessage && session.lastMessage.trim()) {
    return truncateText(session.lastMessage, 18);
  }
  return t('newSession', language);
}

export function renderSidebar(
  sessions: Session[],
  currentSessionId: string,
  language: string
): string {
  const newSessionBtn = `
    <div class="lens-os-agent-sidebar-item new-session" data-action="new-session">
      ${t('newSession', language)}
    </div>
  `;

  const sessionsList = sessions.map(session => `
    <div class="lens-os-agent-sidebar-item ${session.id === currentSessionId ? 'active' : ''}" data-session-id="${session.id}" title="${escapeHtml(session.lastMessage || '')}">
      ${escapeHtml(getSessionDisplayText(session, language))}
    </div>
  `).join('');

  return `
    <div class="lens-os-agent-sidebar-content">
      ${newSessionBtn}
      ${sessionsList}
    </div>
  `;
}
