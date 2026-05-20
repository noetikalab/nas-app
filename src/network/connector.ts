import {discover, type DiscoveredDevice} from '../native/MdnsModule';

/**
 * Discover NAS devices on the local network.
 * Currently wraps mDNS; future layers: cached-IP ping, WiFi P2P fallback.
 */
export async function discoverNas(): Promise<DiscoveredDevice[]> {
  return discover();
}
