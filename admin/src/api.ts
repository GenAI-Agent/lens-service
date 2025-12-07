const API_BASE = '/api/admin';

export interface SitePrompt {
  id: number;
  name: string;
  prompt: string;
  isGlobal: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: number;
  name: string;
  prompt: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeBase {
  id: number;
  name: string;
  description: string;
  content: string;
  category: string | null;
  keywords: string[];
  embedding: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  _count?: {
    messages: number;
  };
}

export interface Message {
  id: number;
  sessionId: string;
  role: string;
  content: string;
  timestamp: Date;
  isCompacted: boolean;
  archived: boolean;
}

// Site Prompts API
export const sitePromptsApi = {
  getAll: async (): Promise<SitePrompt[]> => {
    const res = await fetch(`${API_BASE}/site-prompts`);
    return res.json();
  },

  getById: async (id: number): Promise<SitePrompt> => {
    const res = await fetch(`${API_BASE}/site-prompts/${id}`);
    return res.json();
  },

  create: async (data: Partial<SitePrompt>): Promise<SitePrompt> => {
    const res = await fetch(`${API_BASE}/site-prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: number, data: Partial<SitePrompt>): Promise<SitePrompt> => {
    const res = await fetch(`${API_BASE}/site-prompts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/site-prompts/${id}`, { method: 'DELETE' });
  },
};

// Skills API
export const skillsApi = {
  getAll: async (): Promise<Skill[]> => {
    const res = await fetch(`${API_BASE}/skills`);
    return res.json();
  },

  getById: async (id: number): Promise<Skill> => {
    const res = await fetch(`${API_BASE}/skills/${id}`);
    return res.json();
  },

  create: async (data: Partial<Skill>): Promise<Skill> => {
    const res = await fetch(`${API_BASE}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: number, data: Partial<Skill>): Promise<Skill> => {
    const res = await fetch(`${API_BASE}/skills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/skills/${id}`, { method: 'DELETE' });
  },
};

// Knowledge Base API
export const knowledgeBaseApi = {
  getAll: async (): Promise<KnowledgeBase[]> => {
    const res = await fetch(`${API_BASE}/knowledge-base`);
    return res.json();
  },

  getById: async (id: number): Promise<KnowledgeBase> => {
    const res = await fetch(`${API_BASE}/knowledge-base/${id}`);
    return res.json();
  },

  create: async (data: Partial<KnowledgeBase>): Promise<KnowledgeBase> => {
    const res = await fetch(`${API_BASE}/knowledge-base`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  update: async (id: number, data: Partial<KnowledgeBase>): Promise<KnowledgeBase> => {
    const res = await fetch(`${API_BASE}/knowledge-base/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/knowledge-base/${id}`, { method: 'DELETE' });
  },
};

// Sessions API
export const sessionsApi = {
  getAll: async (): Promise<Session[]> => {
    const res = await fetch(`${API_BASE}/sessions`);
    return res.json();
  },

  getByUserId: async (userId: string): Promise<Session[]> => {
    const res = await fetch(`${API_BASE}/sessions/user/${userId}`);
    return res.json();
  },

  getMessages: async (sessionId: string): Promise<Message[]> => {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);
    return res.json();
  },

  sendManualReply: async (sessionId: string, content: string): Promise<Message> => {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    return res.json();
  },

  delete: async (sessionId: string): Promise<void> => {
    await fetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' });
  },
};
