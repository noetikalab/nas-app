# NasApp 工程搭建文档

## 环境要求

| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 22.11.0 | 推荐用 nvm 管理 |
| pnpm | 11.1.1 | 独立安装，不绑定 node 版本 |
| JDK | 17 | `sudo apt install openjdk-17-jdk` |
| Android SDK | API 34 | 通过 cmdline-tools 安装 |

## Android SDK 配置

```bash
# 下载 cmdline-tools（官网：https://developer.android.com/studio#command-tools）
unzip commandlinetools-linux-*.zip -d ~/Android/cmdline-tools
mv ~/Android/cmdline-tools/cmdline-tools ~/Android/cmdline-tools/latest

# 安装 SDK 组件
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

`~/.bashrc` 环境变量：

```bash
export ANDROID_HOME=$HOME/Android
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
```

## 项目初始化

```bash
pnpm dlx @react-native-community/cli@latest init NasApp
cd NasApp
pnpm install
```

## 目录结构

```
NasApp/
├── android/                  # Android 原生工程
├── src/
│   ├── screens/              # 页面组件
│   ├── components/           # 可复用 UI 组件
│   ├── navigation/           # 路由配置
│   ├── api/                  # 接口请求层
│   ├── store/                # 全局状态（Zustand）
│   ├── hooks/                # 自定义 Hook
│   ├── native/               # JSB 原生模块封装（NFC、WiFi P2P）
│   ├── network/              # 网络连接策略（mDNS → 缓存 → P2P）
│   ├── storage/              # 本地持久化（phone_id、token）
│   ├── utils/                # 工具函数
│   └── types/                # TypeScript 类型定义
├── docs/                     # 项目文档
├── babel.config.js
├── tsconfig.json
└── package.json
```

## 路径别名

`@/` 指向项目根目录，例如：

```ts
import { LoginScreen } from '@/src/screens/LoginScreen'
```

由 `tsconfig.json` 的 `paths` 和 `babel-plugin-module-resolver` 共同支持。

## 依赖说明

### 运行时依赖

| 包 | 版本 | 用途 |
|----|------|------|
| react-native | 0.85.3 | 框架核心 |
| react | 19.2.3 | UI 库 |
| @react-navigation/native | ^7.2.4 | 导航容器 |
| @react-navigation/stack | ^7.9.1 | Stack 导航器 |
| react-native-screens | ^4.25.0 | 原生屏幕优化（导航依赖） |
| react-native-safe-area-context | ^5.5.2 | 安全区域处理 |
| @react-native-async-storage/async-storage | ^3.0.2 | 本地持久化（phone_id、JWT） |
| zustand | ^5.0.13 | 轻量全局状态管理 |
| axios | ^1.16.0 | HTTP 请求 |

### 待安装（开发推进时按需添加）

| 包 | 用途 |
|----|------|
| react-native-nfc-manager | NFC 读标签 |
| react-native-wifi-p2p | WiFi P2P 直连 |
| react-native-fs | 文件系统操作（WebDAV 上传下载） |

### 开发依赖

| 包 | 用途 |
|----|------|
| typescript | ^5.8.3 | 类型系统 |
| eslint | ^8.19.0 | 代码检查 |
| prettier | 2.8.8 | 代码格式化 |
| babel-plugin-module-resolver | ^5.0.3 | 路径别名（配合 tsconfig paths） |
| jest | ^29.6.3 | 单元测试 |

## 开发调试

**必须使用真机**，模拟器不支持 NFC 和 WiFi P2P。

```bash
# 手机开启开发者模式 + USB 调试后
adb devices          # 确认设备已识别

# 启动 Metro bundler
pnpm start

# 另开终端，编译安装到手机
pnpm android
```

## 相关文档

- [NAS 整体方案（飞书）](https://my.feishu.cn/docx/EhQodDF20oHLMixoRaWcrejinIf)
- [手机 APP 连接 NAS 方案（飞书）](https://my.feishu.cn/docx/ECfhdOcRUoa4XHxqCiOckoS7nOb)
- 后端（authd）：`../ldap-demo/`
