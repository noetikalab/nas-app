import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {storage} from '../storage/local';
import type {RootStackParamList} from '../navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DevSettings'>;
};

export function DevSettingsScreen({navigation}: Props) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    storage.getServerUrl().then(setUrl);
  }, []);

  const handleSave = async () => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (!trimmed.startsWith('http')) {
      Alert.alert('Invalid URL', 'Must start with http:// or https://');
      return;
    }
    await storage.saveServerUrl(trimmed);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Dev Settings</Text>
      <Text style={styles.label}>Server URL</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="http://192.168.x.x:8080"
      />
      <TouchableOpacity style={styles.btn} onPress={handleSave}>
        <Text style={styles.btnText}>Save & Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, padding: 28, paddingTop: 80, backgroundColor: '#F8FAFC'},
  title: {fontSize: 20, fontWeight: '700', color: '#0F172A', marginBottom: 32},
  label: {fontSize: 13, fontWeight: '500', color: '#0F172A', marginBottom: 6},
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
  },
  btn: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
});
