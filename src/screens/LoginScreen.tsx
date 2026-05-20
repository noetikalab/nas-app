import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {authApi} from '../api/auth';
import {storage} from '../storage/local';
import type {RootStackParamList} from '../navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const TEAL = '#0D9488';
const TEAL_DARK = '#0F766E';
const BG = '#F8FAFC';
const CARD = '#FFFFFF';
const TEXT = '#0F172A';
const MUTED = '#94A3B8';
const BORDER = '#E2E8F0';
const BORDER_FOCUS = '#0D9488';

export function LoginScreen({navigation}: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [pingStatus, setPingStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');

  // Refresh server URL every time screen is focused
  useFocusEffect(
    useCallback(() => {
      storage.getServerUrl().then(setServerUrl);
    }, []),
  );

  const handlePing = async () => {
    if (pingStatus === 'loading') return;
    setPingStatus('loading');
    try {
      await authApi.ping();
      setPingStatus('ok');
    } catch {
      setPingStatus('fail');
    }
    setTimeout(() => setPingStatus('idle'), 2000);
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const fn = isRegister ? authApi.register : authApi.login;
      const res = await fn({username: username.trim(), password});
      await storage.saveAuth(res.token, username.trim());
      navigation.replace('Home');
    } catch (e: any) {
      Alert.alert('登录失败', e.message ?? '请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.bg}>
        {/* 装饰圆 */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      <View style={styles.card}>
        {/* Server connection bar */}
        <View style={styles.serverBar}>
          {/* Ping button — left */}
          <TouchableOpacity
            style={[
              styles.pingDot,
              pingStatus === 'ok' && styles.pingDotOk,
              pingStatus === 'fail' && styles.pingDotFail,
            ]}
            onPress={handlePing}
            disabled={pingStatus === 'loading'}
            activeOpacity={0.7}>
            {pingStatus === 'loading' ? (
              <ActivityIndicator size="small" color={TEAL} />
            ) : (
              <Text style={styles.pingDotText}>
                {pingStatus === 'ok' ? '✓' : pingStatus === 'fail' ? '✗' : '⚡'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Info — middle */}
          <TouchableOpacity
            style={styles.serverContent}
            onPress={() => navigation.navigate('Discovery')}
            onLongPress={() => navigation.navigate('DevSettings')}
            activeOpacity={0.7}>
            <View style={styles.serverTextArea}>
              <Text style={styles.serverLabel}>
                {serverUrl ? serverUrl : '搜索局域网设备'}
              </Text>
              <Text style={styles.serverSub}>
                {!serverUrl
                  ? '连接到 NAS 后方可登录'
                  : pingStatus === 'idle'
                    ? '点击左侧按钮测试连接'
                    : pingStatus === 'ok'
                      ? '连接正常'
                      : pingStatus === 'fail'
                        ? '无法连接 · 点击重试'
                        : '测试中...'}
              </Text>
            </View>
            <Text style={styles.serverArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logo 区 */}
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>N</Text>
          </View>
          <Text style={styles.logoTitle}>NAS 存证</Text>
          <Text style={styles.logoSub}>可信存储 · 司法级安全</Text>
        </View>

        {/* Tab 切换 */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, !isRegister && styles.tabActive]}
            onPress={() => setIsRegister(false)}>
            <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>
              登录
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, isRegister && styles.tabActive]}
            onPress={() => setIsRegister(true)}>
            <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>
              注册
            </Text>
          </TouchableOpacity>
        </View>

        {/* 输入框 */}
        <View style={styles.form}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>用户名</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'username' && styles.inputFocus,
              ]}
              placeholder="请输入用户名"
              placeholderTextColor={MUTED}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>密码</Text>
            <TextInput
              style={[
                styles.input,
                focusedField === 'password' && styles.inputFocus,
              ]}
              placeholder="请输入密码"
              placeholderTextColor={MUTED}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        {/* 提交按钮 */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>
              {isRegister ? '创建账号' : '登录'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          {isRegister ? '注册即表示同意服务条款' : '忘记密码请联系管理员'}
        </Text>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bg: {
    position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#CCFBF1',
    top: -80,
    right: -80,
    opacity: 0.6,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E0F2FE',
    bottom: 60,
    left: -60,
    opacity: 0.5,
  },
  card: {
    flex: 1,
    width: '100%',
    backgroundColor: CARD,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIconText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.5,
  },
  logoSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: CARD,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: MUTED,
    fontWeight: '500',
  },
  tabTextActive: {
    color: TEXT,
    fontWeight: '600',
  },
  form: {
    gap: 16,
    marginBottom: 20,
  },
  fieldWrap: {},
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: TEXT,
    backgroundColor: '#FAFAFA',
  },
  inputFocus: {
    borderColor: BORDER_FOCUS,
    backgroundColor: '#F0FDFA',
  },
  btn: {
    backgroundColor: TEAL,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: MUTED,
  },
  serverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 28,
    gap: 0,
    marginBottom: 28,
  },
  serverContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  serverTextArea: {flex: 1},
  serverLabel: {fontSize: 13, fontWeight: '600', color: TEXT},
  serverSub: {fontSize: 11, color: MUTED, marginTop: 2},
  serverArrow: {fontSize: 20, color: MUTED},
  pingDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  pingDotOk: {backgroundColor: '#DCFCE7', borderColor: '#22C55E'},
  pingDotFail: {backgroundColor: '#FEE2E2', borderColor: '#EF4444'},
  pingDotText: {fontSize: 15},
});
