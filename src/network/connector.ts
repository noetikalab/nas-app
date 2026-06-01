import {discover, type DiscoveredDevice} from '../native/MdnsModule';
import {connect as p2pConnect} from '../native/WifiP2pModule';
import {storage} from '../storage/local';

/** 连接阶段类型，供 UI 层显示进度 */
export type ConnPhase = 'mdns' | 'cache' | 'p2p' | 'connected';

/** 进度回调参数 */
export interface ConnProgress {
  phase: ConnPhase;       // 当前阶段
  subtitle?: string;      // 辅助文字（如设备名、IP）
  /** mDNS 发现多台设备时返回设备列表，UI 层据此决定是否弹选择页 */
  multipleDevices?: DiscoveredDevice[];
}

/**
 * 连接策略：按优先级依次尝试 mDNS → 缓存 IP ping → WiFi P2P。
 *
 * 三层降级设计：
 *   1. mDNS 局域网发现（1s）     — 有路由器时的最佳路径
 *   2. 缓存 IP ping 验证（2s）    — 上次用过，快速复用
 *   3. WiFi P2P 直连（3-10s）     — 无路由器时直连
 *
 * @param onProgress  可选进度回调，每进入一个新阶段时调用
 *   - 多设备场景：回调 `{ phase: 'mdns', multipleDevices: [...] }`，函数提前返回 null，
 *     由 UI 层跳转 DiscoveryScreen 让用户选择，选完后再次调用本函数继续
 * @returns NAS baseUrl，多设备场景返回 null
 * @throws 三层策略均失败时抛出错误
 */
export async function connectToNas(
  onProgress?: (p: ConnProgress) => void,
): Promise<string | null> {
  // 优先级 1：mDNS 局域网发现
  onProgress?.({phase: 'mdns', subtitle: '正在搜索局域网设备...'});
  try {
    const devices = await discover();
    if (devices.length > 1) {
      // 多台设备：通知 UI 层展示设备选择页面
      onProgress?.({phase: 'mdns', multipleDevices: devices});
      return null;
    }
    if (devices.length === 1) {
      const device = devices[0];
      onProgress?.({phase: 'mdns', subtitle: `发现 ${device.name}，校验中...`});
      const url = `http://${device.ip}:${device.port}`;
      // 校验设备实际可达后再返回，避免标"connected"后登录失败才发现不可达
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 3000);
        const ping = await fetch(`${url}/api/ping`, {signal: ctrl.signal});
        clearTimeout(t);
        if (ping.ok) {
          await storage.saveServerUrl(url);
          onProgress?.({phase: 'connected', subtitle: url});
          return url;
        }
      } catch {
        // 校验失败，继续降级
      }
    }
  } catch {
    // mDNS 失败不报错，静默降级
  }

  // 优先级 2：缓存 IP 快速 ping 验证
  const cached = await storage.getServerUrl();
  if (cached) {
    onProgress?.({phase: 'cache', subtitle: '验证缓存连接...'});
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${cached}/api/ping`, {signal: controller.signal});
      clearTimeout(timer);
      if (res.ok) {
        onProgress?.({phase: 'connected', subtitle: cached});
        return cached;
      }
    } catch {
      // 缓存不可达，继续降级
    }
  }

  // 优先级 3：WiFi P2P 直连（无路由器场景）
  onProgress?.({phase: 'p2p', subtitle: '正在建立 WiFi P2P 直连...'});
  // 微延迟让 UI 渲染 P2P 状态后再发起连接，避免 P2P 瞬时失败时 UI 跳过此阶段
  await new Promise<void>(r => { setTimeout(r, 50); });
  try {
    const {ip, port} = await p2pConnect();
    const url = `http://${ip}:${port}`;
    // 验证 NAS API 实际可达后再返回，避免连上不可用设备
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const ping = await fetch(`${url}/api/ping`, {signal: ctrl.signal});
    clearTimeout(t);
    if (!ping.ok) throw new Error('P2P 已连接但 NAS 服务不可达');
    await storage.saveServerUrl(url);
    onProgress?.({phase: 'connected', subtitle: url});
    return url;
  } catch (e) {
    // 透传原生模块的具体错误，不掩盖原因
    throw e;
  }
}

/** @deprecated 使用 connectToNas() 替代 */
export async function discoverNas(): Promise<DiscoveredDevice[]> {
  return discover();
}
