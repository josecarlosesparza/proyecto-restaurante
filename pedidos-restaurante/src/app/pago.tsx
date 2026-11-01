import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '@/services/api';
import { obtenerToken } from '@/services/session';

type RespuestaInicio = {
  message: string;
  payment_id: number;
  paypal_order_id: string;
  approval_url: string;
  amount: string;
  currency: string;
};

type RespuestaCaptura = {
  message: string;
  order: {
    id: number;
    total: string;
    payment_status: string;
  };
};

export default function PagoScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();

  const orderId =
    typeof params.orderId === 'string' ? params.orderId : '';

  const pedidoValido = /^[1-9]\d*$/.test(orderId);
  const ocupadoRef = useRef(false);

  const [operacion, setOperacion] = useState<
    'iniciar' | 'comprobar' | null
  >(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [approvalUrl, setApprovalUrl] = useState('');
  const [importe, setImporte] = useState('');
  const [pagado, setPagado] = useState(false);

  async function iniciarPago() {
    if (ocupadoRef.current || !pedidoValido || pagado) return;

    ocupadoRef.current = true;
    setOperacion('iniciar');
    setError('');
    setMensaje('');

    try {
      const token = await obtenerToken();

      if (!token) {
        throw new Error('Inicia sesión para pagar tu pedido.');
      }

      const respuesta = await apiRequest<RespuestaInicio>(
        `/orders/${orderId}/paypal`,
        {
          method: 'POST',
          token,
        }
      );

      const url = new URL(respuesta.approval_url);

      if (
        url.protocol !== 'https:' ||
        !['www.sandbox.paypal.com', 'sandbox.paypal.com'].includes(
          url.hostname
        )
      ) {
        throw new Error('El enlace de PayPal Sandbox no es válido.');
      }

      setApprovalUrl(respuesta.approval_url);
      setImporte(`${respuesta.amount} ${respuesta.currency}`);

      // El usuario abrirá PayPal mediante otro botón.
      // Esto también evita bloqueos de ventanas emergentes en web.
      setMensaje(
        'Pago preparado. Abre PayPal Sandbox, aprueba la operación y regresa para comprobar el pago.'
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar el pago.'
      );
    } finally {
      ocupadoRef.current = false;
      setOperacion(null);
    }
  }

  async function abrirPayPal() {
    if (!approvalUrl || ocupadoRef.current) return;

    try {
      setError('');
      await Linking.openURL(approvalUrl);
    } catch {
      setError('No se pudo abrir PayPal. Revisa el navegador del dispositivo.');
    }
  }

  async function comprobarPago() {
    if (ocupadoRef.current || !pedidoValido || pagado) return;

    ocupadoRef.current = true;
    setOperacion('comprobar');
    setError('');
    setMensaje('');

    try {
      const token = await obtenerToken();

      if (!token) {
        throw new Error('Inicia sesión para comprobar el pago.');
      }

      const respuesta = await apiRequest<RespuestaCaptura>(
        `/orders/${orderId}/paypal/capture`,
        {
          method: 'POST',
          token,
        }
      );

      if (respuesta.order.payment_status !== 'paid') {
        throw new Error('El servidor todavía no confirma el pago.');
      }

      setPagado(true);
      setApprovalUrl('');
      setImporte(`${respuesta.order.total} MXN`);
      setMensaje(respuesta.message);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo comprobar el pago.'
      );
    } finally {
      ocupadoRef.current = false;
      setOperacion(null);
    }
  }

  const ocupado = operacion !== null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 32,
        },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.page}>
        <Text style={styles.brand}>TOKIS BURGER</Text>
        <Text style={styles.title}>Pago del pedido</Text>

        {!pedidoValido ? (
          <Text style={styles.error}>
            No se recibió un identificador de pedido válido.
          </Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.orderTitle}>Pedido #{orderId}</Text>

              <Text style={styles.description}>
                PayPal Sandbox · Pago de prueba, sin dinero real.
              </Text>

              {importe ? (
                <Text style={styles.amount}>{importe}</Text>
              ) : null}

              {pagado ? (
                <Text style={styles.paid}>Pago confirmado</Text>
              ) : (
                <Text style={styles.description}>
                  Primero prepara el pago, apruébalo en PayPal y después
                  regresa aquí para comprobarlo.
                </Text>
              )}
            </View>

            {mensaje ? (
              <Text style={styles.message} accessibilityLiveRegion="polite">
                {mensaje}
              </Text>
            ) : null}

            {error ? (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}

            {!pagado && (
              <>
                <Pressable
                  accessibilityRole="button"
                  disabled={ocupado}
                  onPress={iniciarPago}
                  style={[styles.button, ocupado && styles.disabled]}
                >
                  {operacion === 'iniciar' ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {approvalUrl ? 'Recuperar enlace de pago' : 'Preparar pago'}
                    </Text>
                  )}
                </Pressable>

                {approvalUrl ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={ocupado}
                    onPress={abrirPayPal}
                    style={[
                      styles.paypalButton,
                      ocupado && styles.disabled,
                    ]}
                  >
                    <Text style={styles.paypalText}>
                      Abrir PayPal Sandbox
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={ocupado}
                  onPress={comprobarPago}
                  style={[
                    styles.secondaryButton,
                    ocupado && styles.disabled,
                  ]}
                >
                  {operacion === 'comprobar' ? (
                    <ActivityIndicator color="#C2410C" />
                  ) : (
                    <Text style={styles.secondaryText}>
                      Comprobar pago
                    </Text>
                  )}
                </Pressable>

                <Text style={styles.note}>
                  “Comprobar pago” solicita al servidor completar la
                  captura de una operación aprobada. Si ya aprobaste el
                  pago y hubo un error de conexión, comprueba el mismo
                  pago antes de intentar otro.
                </Text>
              </>
            )}
          </>
        )}

        <Link href="/mis-pedidos" style={styles.link}>
          Volver a mis pedidos
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F2',
  },
  content: {
    paddingHorizontal: 24,
  },
  page: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  brand: {
    color: '#C2410C',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
  },
  title: {
    color: '#191919',
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D8CB',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  orderTitle: {
    color: '#252525',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    color: '#686868',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  amount: {
    color: '#C2410C',
    fontSize: 25,
    fontWeight: '800',
    marginBottom: 16,
  },
  paid: {
    color: '#166534',
    fontSize: 18,
    fontWeight: '700',
  },
  message: {
    color: '#166534',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 14,
    lineHeight: 23,
    marginBottom: 18,
  },
  error: {
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 14,
    lineHeight: 23,
    marginBottom: 18,
  },
  button: {
    backgroundColor: '#C2410C',
    borderRadius: 14,
    minHeight: 56,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  paypalButton: {
    backgroundColor: '#FFC439',
    borderRadius: 14,
    minHeight: 56,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  paypalText: {
    color: '#003087',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#C2410C',
    borderRadius: 14,
    minHeight: 56,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  secondaryText: {
    color: '#C2410C',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  note: {
    color: '#705B4C',
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 16,
  },
  link: {
    color: '#C2410C',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 16,
  },
});