# APP 端文件管理开发方案

> 基于后端最新 API（main-claude.md 2026-05-27），分析当前 Gap 并制定开发计划。

## 一、后端 API 现状

所有接口已统一 `/api/` 前缀，全链路验证通过。

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/login` | 无 | 登录 → `{ token, role }` |
| POST | `/api/register` | 无 | 注册 |
| GET | `/api/validate-token` | JWT | 验证 token |
| GET | `/api/device-info` | 无 | 设备信息校验 |
| GET | `/api/files?path=` | JWT | 列出目录 |
| GET | `/api/files/download?path=` | JWT | 下载文件（二进制流） |
| POST | `/api/files/upload` | JWT | 上传文件（multipart：`path` + `file`） |
| POST | `/api/files/mkdir` | JWT | 新建目录 `{ path }` |
| POST | `/api/files/move` | JWT | 移动/重命名 `{ from, to }` |
| DELETE | `/api/files?path=` | JWT | 删除文件（递归） |

### 后端响应格式

**列目录：**
```json
{
  "path": "/data/alice",
  "files": [
    {
      "name": "photo.jpg",
      "size": 102400,
      "type": "file",
      "modified": "2026-05-26T10:24:00Z",
      "permission": "rw-"
    },
    {
      "name": "docs",
      "size": 0,
      "type": "directory",
      "modified": "2026-05-26T10:25:17Z",
      "permission": "rwx"
    }
  ]
}
```

**操作成功（upload/mkdir/move/delete）：**
```json
{ "ok": true, "path": "/data/alice/newfile.txt" }
```

---

## 二、APP 端当前 Gap

### 2.1 API 路径不匹配（P0）

| APP 文件 | 当前路径 | 后端实际路径 |
|----------|---------|------------|
| `auth.ts` | `/login` | `/api/login` |
| `auth.ts` | `/register` | `/api/register` |
| `auth.ts` | `/ping` | `/api/ping` |
| `device.ts` | `/device-info` | `/api/device-info` |
| `files.ts` | `/files` | `/api/files?path=` |

### 2.2 JWT Token 未注入（P0）

`auth.ts` 和 `files.ts` 的 `request()` 函数都没有携带 `Authorization: Bearer <token>` 头。当前 auth 接口不需要 token 所以能工作，但文件操作全部需要。

### 2.3 类型定义不匹配（P0）

**当前 FileItem（`src/types/index.ts`）：**
```ts
{ name, size, modifiedAt, isDir: boolean }
```

**后端返回：**
```ts
{ name, size, type: "file" | "directory", modified, permission }
```

### 2.4 files.ts 全 Mock（P0）

`filesApi.list()` 返回硬编码假数据，其他方法未实现。

### 2.5 HTTP 客户端分散重复（P1）

`auth.ts` 和 `files.ts` 各自实现 `request()`，逻辑重复。应提取为共享 `api/client.ts`。

### 2.6 device.ts 用 axios（P2）

其他模块用 `fetch`，device.ts 用 `axios`，依赖不统一。

---

## 三、改造方案

### Step 1：类型对齐

```ts
// src/types/index.ts
export interface FileItem {
  name: string;
  size: number;
  type: 'file' | 'directory';
  modified: string;
  permission: string;
}

export interface ListFilesResponse {
  path: string;
  files: FileItem[];
}

export interface AuthResponse {
  token: string;
  role: 'admin' | 'user';
}

export interface OkResponse {
  ok: boolean;
  path?: string;
}
```

### Step 2：共享 HTTP 客户端

```ts
// src/api/client.ts
import { storage } from '../storage/local';

export async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 8000,
): Promise<T> {
  const baseUrl = await storage.getServerUrl();
  const token = await storage.getToken();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // multipart 时不设 Content-Type（让浏览器自动设 boundary）
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await fetch(`${baseUrl}${path}`, { headers, signal: controller.signal, ...options });
    if (!res.ok) {
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}
```

### Step 3：文件 API 实现

```ts
// src/api/files.ts
import { request } from './client';
import type { FileItem, ListFilesResponse, OkResponse } from '../types';

export const filesApi = {
  list: (dirPath = '/') =>
    request<ListFilesResponse>(`/api/files?path=${encodeURIComponent(dirPath)}`),

  download: async (filePath: string) => {
    // GET /api/files/download?path=... → 二进制流，返回 blob URL
    // 实现时特殊处理：不调 request()，直接 fetch + blob
  },

  upload: (dirPath: string, file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('path', dirPath);
    form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
    return request<OkResponse>('/api/files/upload', { method: 'POST', body: form });
  },

  mkdir: (dirPath: string) =>
    request<OkResponse>('/api/files/mkdir', { method: 'POST', body: JSON.stringify({ path: dirPath }) }),

  move: (from: string, to: string) =>
    request<OkResponse>('/api/files/move', { method: 'POST', body: JSON.stringify({ from, to }) }),

  remove: (filePath: string) =>
    request<OkResponse>(`/api/files?path=${encodeURIComponent(filePath)}`, { method: 'DELETE' }),
};
```

### Step 4：路径修正确认

| 文件 | 修改 |
|------|------|
| `auth.ts` | `/login` → `/api/login`；复用 `client.ts` 的 request |
| `device.ts` | `/device-info` → `/api/device-info`；改用 fetch（去 axios） |
| `types/index.ts` | FileItem / AuthResponse 类型对齐后端 |
| `HomeScreen.tsx` | `item.isDir` → `item.type === 'directory'`；`item.modifiedAt` → `item.modified` |

### Step 5：HomeScreen 增强（后续）

- 目录导航：点击目录进入子目录、返回上层
- 上传按钮 + 文件选择器（react-native-document-picker）
- 长按菜单：重命名 / 删除 / 移动
- 下拉刷新已有

---

## 四、WiFi P2P 开发（独立分析）

### 4.1 后端现状

- NAS 端：`start.sh` 中 `wpa_cli -i wlan0 p2p_group_add` 预建 GO 组
- 连接后 NAS IP 固定 `192.168.49.1:8080`
- 硬件：Intel AX210 (M.2 A+E)，支持 WiFi 6E + WiFi Direct P2P
- 后端尚未验证端到端 P2P 连通性（main-claude.md 列为高优待办）

### 4.2 APP 端需要做的事

1. **Android 原生模块**：`WifiP2pModule.kt` — 使用 `WifiP2pManager` 发现并连接 NAS 的 P2P GO
2. **权限**：Android 12+ 需要 `NEARBY_WIFI_DEVICES`
3. **TS 封装**：`src/native/WifiP2pModule.ts`
4. **连接策略**：更新 `src/network/connector.ts`，在 mDNS 失败后降级 P2P

### 4.3 待 NAS 端先验证

P2P 开发依赖 NAS 端先验证 `wpa_cli p2p_group_add` 可用性。建议等待同事完成验证后再启动 APP 端 P2P 开发。

---

## 五、实施顺序

| 优先级 | 任务 | 依赖 |
|--------|------|------|
| P0 | 类型 + HTTP 客户端 + API 路径对齐 | 无 |
| P0 | filesApi 对接真实接口（list + mkdir + move + delete） | Step P0 |
| P1 | 文件下载/上传功能 | Step P0 |
| P1 | HomeScreen 目录导航交互 | Step P0 |
| P2 | WiFi P2P 原生模块 | NAS 端 P2P 验证 |
