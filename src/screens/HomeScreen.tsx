import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {storage} from '../storage/local';
import type {RootStackParamList} from '../navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({navigation}: Props) {
  const handleLogout = async () => {
    await storage.clearAuth();
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>主页（待开发）</Text>
      <TouchableOpacity style={styles.btn} onPress={handleLogout}>
        <Text style={styles.btnText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24},
  text: {fontSize: 18, color: '#333'},
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  btnText: {color: '#DC2626', fontSize: 15, fontWeight: '600'},
});
