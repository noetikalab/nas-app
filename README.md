# NasApp

基于 PUF 硬件身份的可信 NAS 存储系统 Android 客户端。

## 功能

- 账号密码登录 / 注册
- NFC 碰一碰无感登录
- WebDAV 文件上传下载
- WiFi P2P 直连（无路由器场景）

## 相关文档

- [NAS 整体方案（飞书）](https://my.feishu.cn/docx/EhQodDF20oHLMixoRaWcrejinIf)
- [手机 APP 连接 NAS 方案（飞书）](https://my.feishu.cn/docx/ECfhdOcRUoa4XHxqCiOckoS7nOb)
- [工程搭建说明](docs/setup.md)

## 环境要求

| 工具 | 版本 |
|------|------|
| Node.js | >= 22.11.0 |
| pnpm | >= 11 |
| JDK | 17 |
| Android SDK | API 34 |

> **必须使用 Android 真机调试**，模拟器不支持 NFC 和 WiFi P2P。

## 快速开始

```bash
pnpm install

# 终端 1：启动 Metro
pnpm start

# 终端 2：编译安装到手机
pnpm android
```

手机需开启**开发者模式 + USB 调试 + USB 安装**，用数据线连接后运行 `adb devices` 确认识别。

## 常见问题

**Gradle 下载超时**：已配置腾讯云镜像，如仍超时检查 `android/gradle/wrapper/gradle-wrapper.properties`。

**INSTALL_FAILED_USER_RESTRICTED**：手机开发者选项中开启 **USB 安装**，部分品牌（小米等）默认关闭。

详细搭建步骤和踩坑记录见 [docs/setup.md](docs/setup.md)。

## 项目结构

```
src/
├── screens/     # 页面
├── navigation/  # 路由
├── api/         # HTTP 请求层
├── native/      # JSB 原生模块封装（NFC、WiFi P2P）
├── network/     # 连接策略（mDNS → 缓存 → P2P）
├── storage/     # 本地持久化
├── store/       # 全局状态（Zustand）
└── types/       # TypeScript 类型
```

## 后端

后端代码见 `../ldap-demo/`，Go authd 服务默认运行在 `:8080`。
