import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

export async function guardarToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.sessionStorage.setItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function obtenerToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.sessionStorage.getItem(TOKEN_KEY);
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function eliminarToken(): Promise<void> {
  if (Platform.OS === 'web') {
    window.sessionStorage.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}