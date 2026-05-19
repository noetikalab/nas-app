import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {storage} from '../storage/local';
import {filesApi} from '../api/files';
import type {FileItem} from '../types';
import type {RootStackParamList} from '../navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const TEAL = '#0D9488';
const TEXT = '#0F172A';
const MUTED = '#94A3B8';
const BORDER = '#E2E8F0';
const BG = '#F8FAFC';

function formatSize(bytes: number): string {
  if (bytes === 0) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function HomeScreen({navigation}: Props) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    storage.getUsername().then(u => setUsername(u ?? ''));
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setError(null);
      const data = await filesApi.list();
      setFiles(data);
    } catch {
      setError('Failed to load files');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFiles();
  }, []);

  const handleLogout = async () => {
    await storage.clearAuth();
    navigation.replace('Login');
  };

  const renderItem = ({item}: {item: FileItem}) => (
    <View style={styles.row}>
      <Text style={styles.icon}>{item.isDir ? '📁' : '📄'}</Text>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.fileMeta}>
          {item.isDir ? '--' : formatSize(item.size)} · {formatDate(item.modifiedAt)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>NAS 文件</Text>
          {username ? <Text style={styles.headerUser}>{username}</Text> : null}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>退出</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchFiles}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={item => item.name}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
          }
          contentContainerStyle={files.length === 0 ? styles.centered : styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.emptyText}>暂无文件</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: BG},
  header: {
    backgroundColor: TEAL,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {fontSize: 22, fontWeight: '700', color: '#fff'},
  headerUser: {fontSize: 13, color: '#CCFBF1', marginTop: 2},
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  logoutText: {color: '#fff', fontSize: 13, fontWeight: '500'},
  centered: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  list: {paddingVertical: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  icon: {fontSize: 28, marginRight: 12},
  fileInfo: {flex: 1},
  fileName: {fontSize: 15, fontWeight: '500', color: TEXT},
  fileMeta: {fontSize: 12, color: MUTED, marginTop: 2},
  separator: {height: 1, backgroundColor: BORDER, marginLeft: 60},
  emptyText: {fontSize: 15, color: MUTED},
  errorText: {fontSize: 15, color: '#DC2626', marginBottom: 12},
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: TEAL,
  },
  retryText: {color: '#fff', fontSize: 14, fontWeight: '600'},
});

