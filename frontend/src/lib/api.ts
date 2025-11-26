// API service for backend communication to the frontend
const API_BASE_URL = 'http://localhost:3002';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    email: string;
    id: string;
    fullName: string;
  };
  session?: any;
  error?: string;
}

export interface DetectionResult {
  disease: string;
  confidence: number;
  description?: string;
  pesticides?: PesticideInfo[];
}

export interface PesticideInfo {
  name: string;
  type: string;
  activeIngredient: string;
  price?: string;
  currency?: string;
  source?: string;
  availability?: string;
}

// Auth API calls
export const signUp = async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, fullName }),
  });

  return response.json();
};

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return response.json();
};

// Disease detection API call
export async function detectDisease(imageBase64: string, token?: string, aiProvider?: string): Promise<DetectionResult> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/detect-disease`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageBase64, aiProvider }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error detecting disease:', error);
    throw error;
  }
}
