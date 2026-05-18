export interface User {
  username: string;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface FileItem {
  name: string;
  size: number;
  modifiedAt: string;
  isDir: boolean;
}
