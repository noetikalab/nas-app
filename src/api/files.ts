import type { FileItem } from '../types';
import { storage } from '../storage/local';

const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}, timeoutMs = 8000): Promise<T> {
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

// TODO: replace mock with real API once backend is ready
const MOCK_FILES: FileItem[] = [
    { name: '文档', size: 0, modifiedAt: '2026-05-15T10:30:00Z', isDir: true },
    { name: '照片', size: 0, modifiedAt: '2026-05-14T08:00:00Z', isDir: true },
    { name: 'README.md', size: 2048, modifiedAt: '2026-05-16T14:22:00Z', isDir: false },
    { name: 'backup.tar.gz', size: 1048576, modifiedAt: '2026-05-10T09:15:00Z', isDir: false },
];

export const filesApi = {
    list: async (): Promise<FileItem[]> => {
        // return request<FileItem[]>('/files');
        return new Promise(resolve => setTimeout(() => resolve(MOCK_FILES), 600));
    },

    upload: (name: string, _body: unknown) =>
        request<FileItem>(`/files/${encodeURIComponent(name)}`, {
            method: 'PUT',
            body: JSON.stringify(_body),
        }),
};
