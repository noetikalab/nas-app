import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {discover, type DiscoveredDevice} from '../native/MdnsModule';
import {getDeviceInfo} from '../api/device';
import {storage} from '../storage/local';
import type {RootStackParamList} from '../navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Discovery'>;
};

const TEAL = '#0D9488';
const TEAL_LIGHT = '#CCFBF1';
const TEXT = '#0F172A';
const MUTED = '#94A3B8';
const CARD = '#FFFFFF';
const BG = '#F8FAFC';

export function DiscoveryScreen({navigation}: Props) {
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [scanning, setScanning] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the scanning indicator
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const runDiscovery = useCallback(async () => {
    setScanning(true);
    setError(null);
    setDevices([]);
    try {
      const found = await discover();
      setDevices(found);
    } catch (e: any) {
      setError(e.message ?? 'mDNS 发现失败');
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    runDiscovery();
  }, [runDiscovery]);

  const handleConnect = useCallback(
    async (device: DiscoveredDevice) => {
      setVerifyingId(device.name);
      const url = `http://${device.ip}:${device.port}`;
      try {
        await getDeviceInfo(url);
        setSelectedId(device.name);
        await storage.saveServerUrl(url);
        setTimeout(() => navigation.goBack(), 400);
      } catch {
        Alert.alert('连接失败', `无法连接到 ${device.name} (${device.ip}:${device.port})，请确认设备在线`);
      } finally {
        setVerifyingId(null);
      }
    },
    [navigation],
  );

  const isAnySelected = selectedId !== null || verifyingId !== null;

  const renderDevice = ({item}: {item: DiscoveredDevice}) => {
    const isSelected = selectedId === item.name;
    const isVerifying = verifyingId === item.name;
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handleConnect(item)}
        disabled={isAnySelected}
        activeOpacity={0.7}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>📡</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardIp}>{item.ip}:{item.port}</Text>
        </View>
        {isVerifying ? (
          <ActivityIndicator color={TEAL} size="small" />
        ) : isSelected ? (
          <Text style={styles.checkMark}>✓</Text>
        ) : (
          <Text style={styles.connectArrow}>→</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Top scanning area */}
      <View style={styles.scanArea}>
        <Animated.View style={[styles.radar, {opacity: pulseAnim}]}>
          <View style={styles.radarInner} />
        </Animated.View>
        <View style={styles.scanDotOuter}>
          <View style={styles.scanDot} />
        </View>
        <Text style={styles.scanTitle}>
          {scanning
            ? '正在搜索局域网 NAS...'
            : error
              ? '搜索失败'
              : `发现 ${devices.length} 台设备`}
        </Text>
        <Text style={styles.scanHint}>
          {scanning
            ? '请确保手机与 NAS 在同一网络'
            : error
              ? '请检查网络连接后重试'
              : '点击选择要连接的设备'}
        </Text>
      </View>

      {/* Error state */}
      {!scanning && error && devices.length === 0 ? (
        <View style={styles.emptyArea}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={styles.emptyTitle}>未发现设备</Text>
          <Text style={styles.emptyHint}>
            {error}{'\n'}
            请确认 NAS 已启动并在同一局域网
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={runDiscovery}>
            <Text style={styles.emptyBtnText}>重新搜索</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => navigation.navigate('DevSettings')}>
            <Text style={styles.manualBtnText}>手动输入地址</Text>
          </TouchableOpacity>
        </View>
      ) : !scanning && !error && devices.length === 0 ? (
        <View style={styles.emptyArea}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>未发现设备</Text>
          <Text style={styles.emptyHint}>
            请确认 NAS 已启动并在同一局域网{'\n'}
            或手动输入服务器地址
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={runDiscovery}>
            <Text style={styles.emptyBtnText}>重新搜索</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => navigation.navigate('DevSettings')}>
            <Text style={styles.manualBtnText}>手动输入地址</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={item => item.name}
          renderItem={renderDevice}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListFooterComponent={
            scanning ? (
              <View style={styles.scanningFooter}>
                <ActivityIndicator color={TEAL} size="small" />
                <Text style={styles.footerText}>搜索中...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.rescanBtn} onPress={runDiscovery}>
                <Text style={styles.rescanText}>⟳ 重新搜索</Text>
              </TouchableOpacity>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: BG},

  /* Scan area */
  scanArea: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 32,
    backgroundColor: '#fff',
  },
  radar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: TEAL_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  radarInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: TEAL,
  },
  scanDotOuter: {
    position: 'absolute',
    top: 100,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: TEAL,
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 6,
  },
  scanHint: {fontSize: 13, color: MUTED},

  /* Device card */
  list: {padding: 20},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardSelected: {borderColor: TEAL, backgroundColor: TEAL_LIGHT},
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDF9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardIconText: {fontSize: 22},
  cardInfo: {flex: 1},
  cardName: {fontSize: 15, fontWeight: '600', color: TEXT, marginBottom: 2},
  cardIp: {fontSize: 13, color: MUTED},
  connectArrow: {fontSize: 20, color: MUTED},
  checkMark: {fontSize: 18, color: TEAL, fontWeight: '700'},
  sep: {height: 10},

  /* Scanning footer */
  scanningFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {fontSize: 14, color: MUTED},
  rescanBtn: {alignItems: 'center', paddingVertical: 16},
  rescanText: {fontSize: 14, color: TEAL, fontWeight: '500'},

  /* Empty state */
  emptyArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIcon: {fontSize: 48, marginBottom: 16},
  emptyTitle: {fontSize: 18, fontWeight: '600', color: TEXT, marginBottom: 8},
  emptyHint: {fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 24},
  emptyBtn: {
    backgroundColor: TEAL,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  emptyBtnText: {color: '#fff', fontSize: 15, fontWeight: '600'},
  manualBtn: {paddingVertical: 8},
  manualBtnText: {color: MUTED, fontSize: 14},
});
