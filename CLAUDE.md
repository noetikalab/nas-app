# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目背景

基于 PUF 硬件身份的可信 NAS 存储系统的 Android 客户端。核心功能：账号密码登录注册、NFC 碰一碰无感登录、WebDAV 文件上传下载、WiFi P2P 直连（无路由器场景）。

**必须用真机调试**，模拟器不支持 NFC 和 WiFi P2P。

相关文档：
- [NAS 整体方案（飞书）](https://my.feishu.cn/docx/EhQodDF20oHLMixoRaWcrejinIf)
- [手机 APP 连接 NAS 方案（飞书）](https://my.feishu.cn/docx/ECfhdOcRUoa4XHxqCiOckoS7nOb)
- 后端代码：`../ldap-demo/`

## 常用命令

```bash
pnpm dev             # 启动开发（adb reverse + Metro，推荐）
pnpm start           # 仅启动 Metro bundler
pnpm android         # 编译并安装到已连接的 Android 真机（原生代码变更后才需要）
pnpm lint            # ESLint 检查
pnpm test            # Jest 单元测试
pnpm test -- --testPathPattern=<file>  # 运行单个测试文件
```

## 架构

**技术栈：** React Native 0.85.3 + TypeScript + React 19

**路径别名：** `@/` 指向项目根目录（由 `tsconfig.json` paths + `babel-plugin-module-resolver` 支持）

**目录职责：**

| 路径 | 职责 |
|------|------|
| `src/screens/` | 页面：LoginScreen、HomeScreen、DevSettingsScreen（长按 ping 按钮进入）、NfcScanScreen、PendingApprovalScreen |
| `src/navigation/` | React Navigation 路由配置 |
| `src/api/` | HTTP 请求层（fetch + AbortController 超时），对接 authd 后端。auth.ts（认证）、files.ts（文件操作） |
| `src/native/` | JSB 原生模块 JS 封装（NfcModule、MdnsModule、WifiP2pModule） |
| `src/network/` | 连接策略：mDNS 发现 → 缓存 IP → WiFi P2P 降级 |
| `src/storage/` | AsyncStorage 封装：phone_id、JWT token 持久化 |
| `src/store/` | Zustand 全局状态 |
| `android/app/src/main/java/com/nasapp/modules/` | Kotlin JSB 原生模块实现 |

**NFC 登录核心流程（`src/screens/NfcScanScreen.tsx`）：**

```ts
const [baseUrl, phoneId] = await Promise.all([
  connector.connect(deviceId),  // 网络连接（mDNS → 缓存 → P2P）
  storage.getPhoneId(),
]);
const result = await api.nfcLogin(baseUrl, { nfc_token, device_id, phone_id });
```

## 后端接口（authd，默认 :8080）

| 接口 | 说明 |
|------|------|
| `POST /register` | 注册 |
| `POST /login` | 密码登录，返回 JWT |
| `POST /nfc-login` | NFC 登录，已绑定返回 JWT，首次返回 `PENDING_APPROVAL` |
| `GET /nfc-login/status?approval_id=` | 轮询首次绑定结果 |

## 关键约束

- `phone_id`：首次启动生成的 UUID，存 AsyncStorage，永不变，用于 NFC 绑定身份
- WiFi P2P 连接成功后 NAS IP 固定为 `192.168.49.1:8080`
- Android 12+ 需要 `NEARBY_WIFI_DEVICES` 权限才能使用 WiFi P2P
- MVP 阶段不做防重放和 HTTPS，正式版再加

## 已知坑点

- **USB IP 动态变化**：USB 网络共享每次重新连接 IP 会变（如 `10.106.26.x`），硬编码 `BASE_URL` 需频繁改代码。解决方案：长按登录页右下角 ping 按钮进入 DevSettings 屏幕，在 App 内修改并持久化服务器地址，无需改代码重编译
- **async-storage 必须用 v2**：v3 依赖国内镜像没有的 Maven 包 `org.asyncstorage.shared_storage:storage-android`，构建直接失败
- **Gradle 镜像**：`gradle-wrapper.properties` 用腾讯云镜像，`build.gradle` 加阿里云 Maven 镜像，详见 `docs/setup.md`
- **tsconfig `baseUrl` 已移除**：新版 TS 不支持，路径别名用 `paths: {"@/*": ["./*"]}`，babel alias 对应 `"@": "./"`
- **安装被拒（INSTALL_FAILED_USER_RESTRICTED）**：检查手机开发者选项中 **USB 安装** 是否开启

## 入口文件

```
index.js     ← Android 启动入口，注册 App 组件，不需要动
App.tsx      ← 根组件，接入 NavigationContainer
```

- `phone_id`：首次启动生成的 UUID，存 AsyncStorage，永不变，用于 NFC 绑定身份
- WiFi P2P 连接成功后 NAS IP 固定为 `192.168.49.1:8080`
- Android 12+ 需要 `NEARBY_WIFI_DEVICES` 权限才能使用 WiFi P2P
- MVP 阶段不做防重放和 HTTPS，正式版再加
