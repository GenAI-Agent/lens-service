import { User } from '../types';

/**
 * 用戶識別和管理服務
 * 使用 localStorage 和 sessionStorage 來識別用戶
 */
export class UserService {
  private static readonly USER_KEY = 'sm_user';
  private static readonly SESSION_KEY = 'sm_session';
  
  /**
   * 獲取或創建當前用戶
   */
  static getCurrentUser(): User {
    // 嘗試從 localStorage 獲取用戶
    const storedUser = localStorage.getItem(this.USER_KEY);
    
    if (storedUser) {
      const user: User = JSON.parse(storedUser);
      
      // 更新 session ID（每次打開瀏覽器都會變）
      const currentSessionId = this.getOrCreateSessionId();
      user.sessionId = currentSessionId;
      user.metadata.lastSeen = Date.now();
      
      // 保存更新
      this.saveUser(user);
      
      return user;
    }
    
    // 創建新用戶
    return this.createNewUser();
  }
  
  /**
   * 創建新用戶
   */
  private static createNewUser(): User {
    const userId = this.generateUserId();
    const sessionId = this.getOrCreateSessionId();
    
    const user: User = {
      id: userId,
      sessionId: sessionId,
      metadata: {
        userAgent: navigator.userAgent,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        totalConversations: 0
      }
    };
    
    this.saveUser(user);
    
    console.log('Created new user:', user.id);
    
    return user;
  }
  
  /**
   * 保存用戶資料
   */
  private static saveUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
  
  /**
   * 獲取或創建 session ID
   */
  private static getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem(this.SESSION_KEY);
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * 生成用戶 ID
   */
  private static generateUserId(): string {
    return 'user_' + this.generateRandomId();
  }
  
  /**
   * 生成 session ID
   */
  private static generateSessionId(): string {
    return 'session_' + this.generateRandomId();
  }
  
  /**
   * 生成隨機 ID
   */
  private static generateRandomId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * 增加用戶的對話計數
   */
  static incrementConversationCount(): void {
    const user = this.getCurrentUser();
    user.metadata.totalConversations++;
    this.saveUser(user);
  }
  
  /**
   * 獲取用戶 ID
   */
  static getUserId(): string {
    return this.getCurrentUser().id;
  }
  
  /**
   * 獲取 session ID
   */
  static getSessionId(): string {
    return this.getCurrentUser().sessionId;
  }
}

