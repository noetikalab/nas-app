import axios from 'axios';

export interface DeviceInfo {
  device_id: string;
  hostname: string;
  version: string;
}

export async function getDeviceInfo(baseUrl: string): Promise<DeviceInfo> {
  const res = await axios.get<DeviceInfo>(`${baseUrl}/device-info`, {timeout: 5000});
  return res.data;
}
