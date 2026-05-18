import React, {useState} from 'react';
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
  Animated,
} from 'react-native';
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

  const [pingStatus, setPingStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');

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

      {/* Ping button — bottom right */}
      <TouchableOpacity
        style={[
          styles.pingBtn,
          pingStatus === 'ok' && styles.pingOk,
          pingStatus === 'fail' && styles.pingFail,
        ]}
        onPress={handlePing}
        onLongPress={() => navigation.navigate('DevSettings')}
        activeOpacity={0.8}>
        {pingStatus === 'loading' ? (
          <ActivityIndicator size="small" color="#64748B" />
        ) : (
          <Text style={styles.pingText}>
            {pingStatus === 'ok' ? '✓' : pingStatus === 'fail' ? '✗' : '⚡'}
          </Text>
        )}
      </TouchableOpacity>
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
    ...StyleSheet.absoluteFillObject,
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
  pingBtn: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  pingOk: {backgroundColor: '#DCFCE7', borderColor: '#16A34A'},
  pingFail: {backgroundColor: '#FEE2E2', borderColor: '#DC2626'},
  pingText: {fontSize: 16},
});
