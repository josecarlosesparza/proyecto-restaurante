import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { apiRequest } from '@/services/api';

const CLAVE_TOKEN_FIREBASE = 'firebase_device_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function obtenerTokenFirebase(): Promise<string> {
  if (Platform.OS !== 'android') {
    throw new Error(
      'Esta integración de notificaciones está preparada para Android.'
    );
  }

  if (!Device.isDevice) {
    throw new Error('Utiliza tu teléfono físico para esta prueba.');
  }

  await Notifications.setNotificationChannelAsync('pedidos', {
    name: 'Actualizaciones de pedidos',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });

  let permisos = await Notifications.getPermissionsAsync();

  if (!permisos.granted && permisos.canAskAgain) {
    permisos = await Notifications.requestPermissionsAsync();
  }

  if (!permisos.granted) {
    throw new Error(
      'Las notificaciones no están autorizadas. Puedes habilitarlas desde los ajustes de la aplicación en Android.'
    );
  }

  const respuesta = await Notifications.getDevicePushTokenAsync();

  if (
    respuesta.type !== 'android' ||
    typeof respuesta.data !== 'string' ||
    !respuesta.data
  ) {
    throw new Error(
      'No se pudo obtener el token de Firebase del teléfono.'
    );
  }

  await SecureStore.setItemAsync(
    CLAVE_TOKEN_FIREBASE,
    respuesta.data
  );

  return respuesta.data;
}

export async function desvincularNotificaciones(
  tokenSesion: string
): Promise<void> {
  if (Platform.OS !== 'android' || !Device.isDevice) {
    return;
  }

  let tokenFirebase = await SecureStore.getItemAsync(
    CLAVE_TOKEN_FIREBASE
  );

  // Compatibilidad con el teléfono registrado antes de este cambio.
  // No solicita permisos al cerrar sesión.
  if (!tokenFirebase) {
    const permisos = await Notifications.getPermissionsAsync();

    if (permisos.granted) {
      const respuesta = await Notifications.getDevicePushTokenAsync();

      if (
        respuesta.type !== 'android' ||
        typeof respuesta.data !== 'string' ||
        !respuesta.data
      ) {
        throw new Error(
          'No se pudo identificar el dispositivo para desvincularlo.'
        );
      }

      tokenFirebase = respuesta.data;
    }
  }

  if (!tokenFirebase) {
    return;
  }

  await apiRequest<{ message: string }>('/device-tokens/remove', {
    method: 'POST',
    token: tokenSesion,
    body: {
      token: tokenFirebase,
    },
  });

  await SecureStore.deleteItemAsync(CLAVE_TOKEN_FIREBASE);
}