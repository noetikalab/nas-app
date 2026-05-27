import type { AuthResponse, LoginRequest } from '../types';
import { storage } from '../storage/local';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit, timeoutMs = 8000): Promise<T> {
    const baseUrl = await storage.getServerUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(`${baseUrl}${API_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            ...options,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    } finally {
        clearTimeout(timer);
    }
}

export const authApi = {
    ping: () => request<{ ok: boolean }>('/ping', { method: 'GET' }),

    login: (data: LoginRequest) =>
        request<AuthResponse>('/login', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    register: (data: LoginRequest) =>
        request<AuthResponse>('/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
