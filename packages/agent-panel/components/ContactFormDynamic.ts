/**
 * Dynamic Contact Form Component with File Upload
 */

import { t } from '../i18n';

interface FormField {
  fieldKey: string;
  fieldType: string;
  label: { [key: string]: string };
  placeholder?: { [key: string]: string };
  isRequired: boolean;
  options?: Array<{ key: string; label: { [key: string]: string } }>;
}

interface FormSettings {
  enabledFields: string[];
  problemTypes: Array<{ key: string; label: { [key: string]: string } }>;
  allowFileUpload: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

export class ContactFormDynamic {
  private fields: FormField[] = [];
  private settings: FormSettings | null = null;
  private selectedFiles: File[] = [];
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async loadFormConfig(): Promise<void> {
    try {
      const [fieldsRes, settingsRes] = await Promise.all([
        fetch(`${this.apiUrl}/api/lens/contact-form-fields`),
        fetch(`${this.apiUrl}/api/lens/contact-form-settings`),
      ]);

      if (fieldsRes.ok) {
        this.fields = await fieldsRes.json();
      }

      if (settingsRes.ok) {
        this.settings = await settingsRes.json();
      }
    } catch (error) {
      console.error('Failed to load form config:', error);
    }
  }

  render(language: string): string {
    if (!this.settings) {
      return this.renderLoading();
    }

    const enabledFields = this.fields.filter(f =>
      this.settings!.enabledFields.includes(f.fieldKey)
    );

    const formGroups = enabledFields.map(field => this.renderField(field, language)).join('');

    const fileUploadSection = this.settings.allowFileUpload ? this.renderFileUpload(language) : '';

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
          ${formGroups}
          ${fileUploadSection}

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

  private renderLoading(): string {
    return `
      <div class="lens-os-agent-contact-form">
        <div class="lens-os-agent-form-body" style="text-align: center; padding: 40px;">
          <div style="font-size: 14px; color: #666;">載入表單中...</div>
        </div>
      </div>
    `;
  }

  private renderField(field: FormField, language: string): string {
    const label = field.label[language] || field.label['zh-TW'] || field.fieldKey;
    const placeholder = field.placeholder?.[language] || field.placeholder?.['zh-TW'] || '';
    const required = field.isRequired ? '*' : '';

    switch (field.fieldType) {
      case 'text':
      case 'email':
        return `
          <div class="lens-os-agent-form-group">
            <label>${label} ${required}</label>
            <input
              type="${field.fieldType}"
              placeholder="${placeholder}"
              id="contact_${field.fieldKey}"
              data-field-key="${field.fieldKey}"
              ${field.isRequired ? 'required' : ''}
            >
          </div>
        `;

      case 'textarea':
        return `
          <div class="lens-os-agent-form-group">
            <label>${label} ${required}</label>
            <textarea
              rows="4"
              placeholder="${placeholder}"
              id="contact_${field.fieldKey}"
              data-field-key="${field.fieldKey}"
              ${field.isRequired ? 'required' : ''}
            ></textarea>
          </div>
        `;

      case 'select':
        const options = field.options || [];
        const optionHTML = options.map(opt => {
          const optLabel = opt.label[language] || opt.label['zh-TW'] || opt.key;
          return `<option value="${opt.key}">${optLabel}</option>`;
        }).join('');

        return `
          <div class="lens-os-agent-form-group">
            <label>${label} ${required}</label>
            <select
              id="contact_${field.fieldKey}"
              data-field-key="${field.fieldKey}"
              ${field.isRequired ? 'required' : ''}
            >
              <option value="">${placeholder || 'Please select'}</option>
              ${optionHTML}
            </select>
          </div>
        `;

      default:
        return '';
    }
  }

  private renderFileUpload(language: string): string {
    return `
      <div class="lens-os-agent-form-group">
        <label>${t('attachments', language)}</label>
        <div class="lens-os-agent-file-upload">
          <input
            type="file"
            id="contactFiles"
            multiple
            accept="${this.settings?.allowedFileTypes.join(',') || '*'}"
            style="display: none;"
          >
          <button
            type="button"
            class="lens-os-agent-file-upload-btn"
            onclick="document.getElementById('contactFiles').click()"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            選擇檔案
          </button>
          <div id="fileList" class="lens-os-agent-file-list"></div>
          <div class="lens-os-agent-file-hint">
            最大檔案大小: ${this.formatFileSize(this.settings?.maxFileSize || 10485760)}
          </div>
        </div>
      </div>
    `;
  }

  private formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)}MB`;
  }

  async handleSubmit(userId: string, language: string, sessionId?: string): Promise<boolean> {
    try {
      // Collect form data
      const formData: any = { userId, sessionId };
      const inputs = document.querySelectorAll('[data-field-key]');

      inputs.forEach((input: any) => {
        const fieldKey = input.dataset.fieldKey;
        formData[fieldKey] = input.value;
      });

      // Validate required fields
      const requiredFields = this.fields.filter(f =>
        f.isRequired && this.settings!.enabledFields.includes(f.fieldKey)
      );

      for (const field of requiredFields) {
        if (!formData[field.fieldKey] || formData[field.fieldKey].trim() === '') {
          const label = field.label[language] || field.label['zh-TW'];
          alert(`請填寫 ${label}`);
          return false;
        }
      }

      // Handle file uploads
      const attachments: Array<{ name: string; size: number; data: string }> = [];

      if (this.selectedFiles.length > 0) {
        for (const file of this.selectedFiles) {
          // Check file size
          if (file.size > (this.settings?.maxFileSize || 10485760)) {
            alert(`檔案 ${file.name} 超過大小限制`);
            return false;
          }

          // Convert to base64
          const base64 = await this.fileToBase64(file);
          attachments.push({
            name: file.name,
            size: file.size,
            data: base64,
          });
        }
      }

      // Submit to server
      const response = await fetch(`${this.apiUrl}/api/lens/contact-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, attachments }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      alert(t('submitted', language));
      return true;

    } catch (error) {
      console.error('Form submission error:', error);
      alert(t('submitFailed', language));
      return false;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  handleFileSelect(files: FileList | null): void {
    if (!files) return;

    this.selectedFiles = Array.from(files);
    this.updateFileList();
  }

  private updateFileList(): void {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;

    if (this.selectedFiles.length === 0) {
      fileList.innerHTML = '';
      return;
    }

    const fileItems = this.selectedFiles.map((file, index) => `
      <div class="lens-os-agent-file-item">
        <span>${file.name}</span>
        <span class="lens-os-agent-file-size">(${this.formatFileSize(file.size)})</span>
        <button
          type="button"
          class="lens-os-agent-file-remove"
          onclick="window.contactFormDynamic.removeFile(${index})"
        >
          ×
        </button>
      </div>
    `).join('');

    fileList.innerHTML = fileItems;
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.updateFileList();
  }
}

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).ContactFormDynamic = ContactFormDynamic;
}
