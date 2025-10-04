/**
 * 內聯樣式定義
 * 使用內聯樣式避免與宿主網站的 CSS 衝突
 */
export const styles = {
  container: `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 999999;
  `,
  
  overlay: `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    z-index: 1;
    backdrop-filter: blur(2px);
  `,
  
  panel: `
    position: fixed;
    top: 0;
    height: 100%;
    background: white;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    transition: right 0.3s ease, left 0.3s ease;
    pointer-events: auto;
    z-index: 2;
  `,
  
  panelHeader: `
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #6366f1;
    color: white;
  `,
  
  panelTitle: `
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  `,
  
  closeButton: `
    background: transparent;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.2s;
  `,
  
  viewContainer: `
    flex: 1;
    overflow: hidden;
    position: relative;
  `,
  
  chatView: `
    height: 100%;
    display: flex;
    flex-direction: column;
  `,
  
  messagesContainer: `
    flex: 1;
    overflow-y: auto;
    padding: 80px 20px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f3f4f6;
  `,
  
  userMessage: `
    align-self: flex-end;
    background: #6366f1;
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 80%;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.5;
  `,
  
  assistantMessage: `
    align-self: flex-start;
    background: #f3f4f6;
    color: #1f2937;
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 80%;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.5;
  `,
  
  sources: `
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    font-size: 12px;
  `,
  
  sourceLink: `
    color: #6366f1;
    text-decoration: none;
    display: inline-block;
    margin-top: 4px;
  `,
  
  inputContainer: `
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,

  imagePreview: `
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: #f3f4f6;
    border-radius: 8px;
    position: relative;
  `,

  previewImage: `
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #d1d5db;
  `,

  removeImageButton: `
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  `,

  imageContext: `
    flex: 1;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.4;
  `,
  
  input: `
    width: 100%;
    padding: 16px 50px 16px 16px;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    font-size: 15px;
    outline: none;
    transition: border-color 0.2s;
    min-height: 50px;
    box-sizing: border-box;
  `,

  sendButton: `
    padding: 12px 24px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  `,

  sendIconButton: `
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
  `,

  iconButton: `
    background: white;
    border: 1px solid #e5e7eb;
    color: #6b7280;
    border-radius: 6px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  `,
  
  rulesView: `
    height: 100%;
    overflow-y: auto;
    padding: 20px;
  `,
  
  ruleItem: `
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
  `,
  
  ruleItemActive: `
    border-color: #6366f1;
    background: #eef2ff;
  `,
  
  ruleTitle: `
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  `,
  
  ruleDescription: `
    margin: 0;
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
  `,
  
  panelFooter: `
    padding: 12px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 8px;
    background: #f9fafb;
  `,
  
  tabButton: `
    flex: 1;
    padding: 10px;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    color: #6b7280;
  `,
  
  tabButtonActive: `
    background: #6366f1;
    color: white;
    border-color: #6366f1;
  `
};

