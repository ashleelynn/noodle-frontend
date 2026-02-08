const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8004';

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  is_premium: boolean;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface SessionResponse {
  id: number;
  user_id: number;
  buddy_id: string;
  mode: string;
  story_context?: string | null;
  is_active: boolean;
}

export interface DrawingResponse {
  id: number;
  user_id: number;
  session_id: number;
  title?: string | null;
  canvas_data: string;
  thumbnail_url?: string | null;
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new Error(`Network error: cannot reach backend at ${API_BASE_URL}. Is the backend running?`);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (typeof data?.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        const first = data.detail[0];
        const field = Array.isArray(first?.loc) ? first.loc.join('.') : 'field';
        const msg = typeof first?.msg === 'string' ? first.msg : 'invalid value';
        message = `${field}: ${msg}`;
      }
    } catch {
      // Ignore parsing errors and use fallback message.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function loginWithBackend(username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function registerWithBackend(username: string, email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function createDrawingSession(token: string, buddyId: string, mode: 'digital' | 'physical' = 'digital') {
  return request<SessionResponse>('/api/sessions/', {
    method: 'POST',
    body: JSON.stringify({ buddy_id: buddyId, mode }),
  }, token);
}

export async function saveDrawing(
  token: string,
  sessionId: number,
  canvasData: string,
  title?: string,
) {
  return request<DrawingResponse>('/api/drawings/', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      canvas_data: canvasData,
      title: title ?? 'My Drawing',
      thumbnail_url: canvasData,
    }),
  }, token);
}

export async function getMyDrawings(token: string) {
  return request<DrawingResponse[]>('/api/drawings/', { method: 'GET' }, token);
}

// The current backend does not expose a dedicated PRD prompt-generation endpoint yet.
// We use a deterministic local fallback to keep Buddy Mode functional end-to-end.
export function generateBuddyPromptFromInterests(interests: string[]) {
  const picked = interests.filter(Boolean).slice(0, 2);
  const a = picked[0] ?? 'dragons';
  const b = picked[1] ?? 'birthday parties';

  return {
    prompt: `Draw a ${a} adventure with ${b}!`,
    guideQuestions: [
      `Who is the main character in your ${a} scene?`,
      `What special colors or decorations are there for ${b}?`,
      'What is happening in the background?',
      'What fun detail can you add to make it magical?',
    ],
  };
}
