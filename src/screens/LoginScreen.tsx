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
import {c} from '../theme/tokens';
import {shared} from '../theme/shared';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export function LoginScreen({navigation}: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('');
  const [pingStatus, setPingStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle');

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
      style={shared.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[shared.centered, styles.card]}>
        {/* Server connection bar */}
        <View style={styles.serverBar}>
          <TouchableOpacity
            style={[
              styles.pingDot,
              pingStatus === 'ok' && shared.statusOk,
              pingStatus === 'fail' && shared.statusFail,
            ]}
            onPress={handlePing}
            disabled={pingStatus === 'loading'}
            activeOpacity={0.7}>
            {pingStatus === 'loading' ? (
              <ActivityIndicator size="small" color={c.foreground} />
            ) : (
              <Text style={styles.pingDotText}>
                {pingStatus === 'ok' ? '✓' : pingStatus === 'fail' ? '✗' : '⚡'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serverContent}
            onPress={() => navigation.navigate('Discovery')}
            onLongPress={() => navigation.navigate('DevSettings')}
            activeOpacity={0.7}>
            <View style={styles.serverTextArea}>
              <Text style={styles.serverLabel}>
                {serverUrl ? serverUrl : '搜索局域网设备'}
              </Text>
              <Text style={shared.subtitle}>
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

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>N</Text>
          </View>
          <Text style={shared.title}>NAS</Text>
          <Text style={[shared.subtitle, styles.logoSub]}>私有云存储</Text>
        </View>

        {/* Tabs */}
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

        {/* Fields */}
        <View style={styles.form}>
          <View>
            <Text style={shared.label}>用户名</Text>
            <TextInput
              style={[shared.input, focusedField === 'username' && styles.inputFocus]}
              placeholder="请输入用户名"
              placeholderTextColor={c.mutedForeground}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          <View>
            <Text style={shared.label}>密码</Text>
            <TextInput
              style={[shared.input, focusedField === 'password' && styles.inputFocus]}
              placeholder="请输入密码"
              placeholderTextColor={c.mutedForeground}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[shared.btn, loading && shared.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={shared.btnText}>
              {isRegister ? '创建账号' : '登录'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={shared.hint}>
          {isRegister ? '注册即表示同意服务条款' : '忘记密码请联系管理员'}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
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
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoIconText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
  },
  logoSub: {marginTop: 4, letterSpacing: 0.5},
  tabs: {
    flexDirection: 'row',
    backgroundColor: c.muted,
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  tab: {flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center'},
  tabActive: {
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.border,
  },
  tabText: {fontSize: 14, color: c.mutedForeground, fontWeight: '500'},
  tabTextActive: {color: c.foreground, fontWeight: '600'},
  form: {alignSelf: 'stretch', gap: 16, marginBottom: 20},
  inputFocus: {borderColor: c.primary, backgroundColor: c.background},
  serverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.muted,
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 28,
  },
  serverContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  serverTextArea: {flex: 1},
  serverLabel: {fontSize: 13, fontWeight: '600', color: c.foreground},
  serverArrow: {fontSize: 20, color: c.mutedForeground},
  pingDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.muted,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: c.border,
  },
  pingDotText: {fontSize: 15},
});
