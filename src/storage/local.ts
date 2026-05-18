import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'jwt_token',
  USERNAME: 'username',
  SERVER_URL: 'server_url',
};

const DEFAULT_SERVER_URL = 'http://10.106.26.92:8080';

export const storage = {
  saveAuth: (token: string, username: string) =>
    AsyncStorage.multiSet([[KEYS.TOKEN, token], [KEYS.USERNAME, username]]),

  getToken: () => AsyncStorage.getItem(KEYS.TOKEN),

  getUsername: () => AsyncStorage.getItem(KEYS.USERNAME),

  clearAuth: () => AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USERNAME]),

  getServerUrl: async () =>
    (await AsyncStorage.getItem(KEYS.SERVER_URL)) ?? DEFAULT_SERVER_URL,

  saveServerUrl: (url: string) => AsyncStorage.setItem(KEYS.SERVER_URL, url),
};
