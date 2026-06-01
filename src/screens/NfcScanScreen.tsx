import React, {useEffect, useState} from 'react';
import {View, Text, Alert, ActivityIndicator, StyleSheet} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {connectToNas} from '../network/connector';
import {getDeviceInfo} from '../api/device';
import {storage} from '../storage/local';
import type {RootStackParamList} from '../navigation';
import {c} from '../theme/tokens';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NfcScan'>;
};

/**
 * NFC 碰一碰触发页面。
 *
 * 页面加载后自动执行：
 *   1. 建立网络连接（mDNS → 缓存 IP → WiFi P2P）
 *   2. 校验 NAS 设备身份（GET /api/device-info）
 *   3. 跳转到 LoginScreen 让用户手动输入密码登录
 *
 * MVP 阶段：NFC 只做触发入口，登录仍需手动输入密码。
 * 增强版会加入 nfc_token 实现免密登录。
 */
export function NfcScanScreen({navigation}: Props) {
  const [status, setStatus] = useState<'connecting' | 'verifying' | 'error'>('connecting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    handleConnect();
  }, []);

  async function handleConnect() {
    try {
      // 1. 建立连接（按三层降级策略）
      setStatus('connecting');
      const baseUrl = await connectToNas();
      if (!baseUrl) {
        throw new Error('发现多台 NAS 设备，请手动选择');
      }

      // 2. 校验设备身份
      setStatus('verifying');
      const info = await getDeviceInfo(baseUrl);
      // TODO: 与 NFC 标签中读取的 device_id 比对
      void info; // 暂时使用 info 避免 lint 警告

      // 3. 持久化服务器地址，跳转登录
      await storage.saveServerUrl(baseUrl);
      navigation.replace('Login');
    } catch (e: any) {
      const msg = e.message || '请检查 NAS 是否开机';
      setStatus('error');
      setErrorMsg(msg);
      Alert.alert('连接失败', msg);
    }
  }

  return (
    <View style={styles.root}>
      {status === 'connecting' && (
        <>
          <ActivityIndicator size="large" color={c.foreground} />
          <Text style={styles.text}>正在连接 NAS...</Text>
          <Text style={styles.hint}>尝试 mDNS 发现 → 缓存IP → WiFi P2P 直连</Text>
        </>
      )}
      {status === 'verifying' && (
        <>
          <ActivityIndicator size="large" color={c.foreground} />
          <Text style={styles.text}>校验设备身份...</Text>
        </>
      )}
      {status === 'error' && (
        <>
          <Text style={styles.text}>连接失败</Text>
          <Text style={styles.hint}>{errorMsg}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.background,
    paddingHorizontal: 40,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: c.foreground,
    marginTop: 20,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: c.mutedForeground,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
