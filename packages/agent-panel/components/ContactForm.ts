/**
 * Contact Form Component
 */

import { t } from '../i18n';

export function renderContactForm(language: string): string {
  return `
    <div class="lens-os-agent-contact-form">
      <div class="lens-os-agent-form-header">
        <h2>${t('contactTitle', language)}</h2>
        <button class="lens-os-agent-back-btn" data-action="back-to-chat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          ${t('back', language)}
        </button>
      </div>

      <div class="lens-os-agent-form-body">
        <div class="lens-os-agent-form-group">
          <label>${t('name', language)} *</label>
          <input type="text" placeholder="${t('namePlaceholder', language)}" id="contactName">
        </div>

        <div class="lens-os-agent-form-group">
          <label>${t('email', language)} *</label>
          <input type="email" placeholder="${t('emailPlaceholder', language)}" id="contactEmail">
        </div>

        <div class="lens-os-agent-form-group">
          <label>${t('issueType', language)}</label>
          <select id="contactType">
            <option>${t('selectIssueType', language)}</option>
            <option>${t('accountIssue', language)}</option>
            <option>${t('paymentIssue', language)}</option>
            <option>${t('techSupport', language)}</option>
            <option>${t('feedback', language)}</option>
            <option>${t('other', language)}</option>
          </select>
        </div>

        <div class="lens-os-agent-form-group">
          <label>${t('description', language)} *</label>
          <textarea rows="4" placeholder="${t('descriptionPlaceholder', language)}" id="contactMessage"></textarea>
        </div>

        <button class="lens-os-agent-submit-btn" data-action="submit-contact">
          ${t('submit', language)}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  `;
}
