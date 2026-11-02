import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { apiRequest } from '@/services/api';
import { obtenerTokenFirebase } from '@/services/notifications';
import { obtenerToken } from '@/services/session';

export default function ActivarNotificaciones() {
  const ocupado = useRef(false);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function activar() {
    if (ocupado.current) return;

    ocupado.current = true;
    setCargando(true);
    setMensaje('');
    setError('');

    try {
      const tokenSesion = await obtenerToken();

      if (!tokenSesion) {
        throw new Error('Inicia sesión para activar las notificaciones.');
      }

      const tokenFirebase = await obtenerTokenFirebase();

      const respuesta = await apiRequest<{ message: string }>(
        '/device-tokens',
        {
          method: 'POST',
          token: tokenSesion,
          body: {
            token: tokenFirebase,
            platform: 'android',
          },
        }
      );

      setMensaje(respuesta.message);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudieron activar las notificaciones.'
      );
    } finally {
      ocupado.current = false;
      setCargando(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        disabled={cargando}
        onPress={activar}
        style={({ pressed }) => [
          styles.button,
          (pressed || cargando) && styles.disabled,
        ]}
      >
        {cargando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Activar notificaciones
          </Text>
        )}
      </Pressable>

      <Text style={styles.description}>
        Recibe avisos sobre los cambios de estado de tus pedidos.
      </Text>

      {!!mensaje && (
        <Text accessibilityLiveRegion="polite" style={styles.success}>
          {mensaje}
        </Text>
      )}

      {!!error && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  button: {
    minHeight: 52,
    backgroundColor: '#C2410C',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.65,
  },
  description: {
    color: '#686868',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  success: {
    color: '#166534',
    lineHeight: 22,
    marginTop: 10,
  },
  error: {
    color: '#B91C1C',
    lineHeight: 22,
    marginTop: 10,
  },
});