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
import {c} from '../theme/tokens';
import {shared} from '../theme/shared';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

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
      <View style={styles.fileIcon}>
        <Text style={styles.fileIconText}>{item.isDir ? '/' : '●'}</Text>
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={shared.subtitle}>
          {item.isDir ? '--' : formatSize(item.size)} · {formatDate(item.modifiedAt)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={shared.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>文件</Text>
          {username ? <Text style={styles.headerUser}>{username}</Text> : null}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>退出</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={shared.centered}>
          <ActivityIndicator size="large" color={c.foreground} />
        </View>
      ) : error ? (
        <View style={shared.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={shared.emptyBtn} onPress={fetchFiles}>
            <Text style={shared.emptyBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={item => item.name}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.foreground]} />
          }
          contentContainerStyle={files.length === 0 ? shared.centered : styles.list}
          ItemSeparatorComponent={() => <View style={shared.separator} />}
          ListEmptyComponent={<Text style={shared.subtitle}>暂无文件</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: c.primary,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {fontSize: 22, fontWeight: '700', color: '#FFFFFF'},
  headerUser: {fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2},
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  logoutText: {color: '#FFFFFF', fontSize: 13, fontWeight: '500'},
  list: {paddingVertical: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: c.background,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: c.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileIconText: {fontSize: 15, color: c.foreground, fontWeight: '600'},
  fileInfo: {flex: 1},
  fileName: {fontSize: 15, fontWeight: '500', color: c.foreground},
  errorText: {fontSize: 15, color: c.destructive, marginBottom: 12},
});
