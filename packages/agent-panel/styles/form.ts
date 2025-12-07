/**
 * Contact form styles
 * All classes prefixed with 'lens-os-agent-' to avoid conflicts
 */

export const formStyles = `
  .lens-os-agent-contact-form {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
    padding: 0 16px;
  }

  .lens-os-agent-form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  .lens-os-agent-form-header h2 {
    color: #333;
    font-size: 18px;
    font-weight: 600;
  }

  .lens-os-agent-back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    padding: 6px 14px;
    border-radius: 18px;
    color: #333;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.25s ease;
    font-family: inherit;
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.4),
      inset 0 -1px 2px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
  }

  .lens-os-agent-back-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.25), transparent);
    pointer-events: none;
  }

  .lens-os-agent-back-btn:hover {
    background: rgba(0, 0, 0, 0.12);
    transform: translateX(-4px);
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.5),
      inset 0 -1px 2px rgba(0, 0, 0, 0.15);
  }

  .lens-os-agent-form-body {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
    padding-bottom: 20px;
  }

  .lens-os-agent-form-body::-webkit-scrollbar {
    width: 5px;
  }

  .lens-os-agent-form-body::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.03);
    border-radius: 3px;
  }

  .lens-os-agent-form-body::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
  }

  .lens-os-agent-form-group {
    margin-bottom: 14px;
  }

  .lens-os-agent-form-group label {
    display: block;
    color: #333;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 6px;
  }

  .lens-os-agent-form-group input,
  .lens-os-agent-form-group select,
  .lens-os-agent-form-group textarea {
    width: 100%;
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 10px;
    font-size: 13px;
    color: #333;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.1),
      inset -1px -1px 3px rgba(255, 255, 255, 0.5),
      0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .lens-os-agent-form-group input:focus,
  .lens-os-agent-form-group select:focus,
  .lens-os-agent-form-group textarea:focus {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(0, 200, 150, 0.3);
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.08),
      inset -1px -1px 3px rgba(255, 255, 255, 0.6),
      0 0 0 2px rgba(0, 245, 160, 0.15);
  }

  .lens-os-agent-form-group textarea {
    resize: vertical;
    min-height: 110px;
  }

  .lens-os-agent-submit-btn {
    width: 100%;
    padding: 10px 20px;
    background: linear-gradient(135deg, #00f5a0 0%, #00d9f5 100%);
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #1a1a2e;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.25s ease;
    margin-top: 12px;
    font-family: inherit;
    box-shadow:
      0 4px 12px rgba(0, 245, 160, 0.3),
      inset 0 2px 4px rgba(255, 255, 255, 0.5),
      inset 0 -2px 3px rgba(0, 0, 0, 0.15);
    position: relative;
    overflow: hidden;
  }

  .lens-os-agent-submit-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.4), transparent);
    pointer-events: none;
  }

  .lens-os-agent-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow:
      0 6px 18px rgba(0, 245, 160, 0.4),
      inset 0 2px 4px rgba(255, 255, 255, 0.6),
      inset 0 -2px 3px rgba(0, 0, 0, 0.2);
  }

  /* File Upload Styles */
  .lens-os-agent-file-upload {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .lens-os-agent-file-upload-btn {
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: 1px dashed rgba(0, 0, 0, 0.25);
    border-radius: 10px;
    font-size: 13px;
    color: #333;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.3),
      inset 0 -1px 2px rgba(0, 0, 0, 0.08);
  }

  .lens-os-agent-file-upload-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(0, 245, 160, 0.5);
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.4),
      inset 0 -1px 2px rgba(0, 0, 0, 0.1);
  }

  .lens-os-agent-file-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lens-os-agent-file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border-radius: 8px;
    font-size: 12px;
    box-shadow:
      inset 0 1px 2px rgba(255, 255, 255, 0.3),
      inset 0 -1px 1px rgba(0, 0, 0, 0.08);
  }

  .lens-os-agent-file-size {
    color: #666;
    font-size: 11px;
  }

  .lens-os-agent-file-remove {
    margin-left: auto;
    width: 20px;
    height: 20px;
    background: rgba(239, 68, 68, 0.1);
    border: none;
    border-radius: 50%;
    color: #ef4444;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    transition: all 0.2s ease;
  }

  .lens-os-agent-file-remove:hover {
    background: #ef4444;
    color: white;
  }

  .lens-os-agent-file-hint {
    font-size: 11px;
    color: #666;
  }
`;
