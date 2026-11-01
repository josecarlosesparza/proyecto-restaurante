import { Link, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '@/services/api';
import { obtenerToken } from '@/services/session';

type DetallePedido = {
  id: number;
  product_name: string;
  quantity: number;
  subtotal: string;
};

type Pedido = {
  id: number;
  total: string;
  status: string;
  payment_status: string;
  delivery_address: string;
  created_at: string;
  items: DetallePedido[];
};

type RespuestaPedidos = {
  data: Pedido[];
  current_page: number;
  last_page: number;
};

const estados: Record<string, string> = {
  received: 'Recibido',
  preparing: 'En preparación',
  out_for_delivery: 'En reparto',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const estadosPago: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'No completado',
  refunded: 'Reembolsado',
};

export default function MisPedidosScreen() {
  const insets = useSafeAreaInsets();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pagina, setPagina] = useState(1);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError('');

      try {
        const token = await obtenerToken();

        if (!token) {
          throw new Error('Inicia sesión para consultar tus pedidos.');
        }

        const respuesta = await apiRequest<RespuestaPedidos>(
          `/orders?page=${pagina}`,
          { token }
        );

        if (activo) {
          setPedidos(respuesta.data);
          setUltimaPagina(respuesta.last_page);
        }
      } catch (error) {
        if (activo) {
          setError(
            error instanceof Error
              ? error.message
              : 'No se pudieron consultar los pedidos.'
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [pagina, intento]);

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
        <Text style={styles.title}>Mis pedidos</Text>

        {cargando ? (
          <ActivityIndicator size="large" color="#C2410C" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <>
            {pedidos.length === 0 && (
              <Text style={styles.description}>
                Todavía no tienes pedidos registrados.
              </Text>
            )}

            {pedidos.map((pedido) => (
              <View key={pedido.id} style={styles.card}>
                <Text style={styles.orderTitle}>
                  Pedido #{pedido.id}
                </Text>

                <Text style={styles.date}>
                  {new Date(pedido.created_at).toLocaleString('es-MX')}
                </Text>

                <Text style={styles.status}>
                  {estados[pedido.status] ?? pedido.status}
                </Text>

                <Text style={styles.description}>
                  Pago: {estadosPago[pedido.payment_status] ??
                    pedido.payment_status}
                </Text>

                {pedido.items.map((item) => (
                  <View key={item.id} style={styles.row}>
                    <Text style={styles.itemName}>
                      {item.quantity} × {item.product_name}
                    </Text>

                    <Text style={styles.amount}>
                      ${Number(item.subtotal).toFixed(2)}
                    </Text>
                  </View>
                ))}

                <Text style={styles.total}>
                  Total: ${Number(pedido.total).toFixed(2)} MXN
                </Text>

                <Text style={styles.address}>
                  Entrega: {pedido.delivery_address}
                </Text>

                {pedido.payment_status === 'pending' &&
                  pedido.status !== 'cancelled' && (
                    <Link
                      href={{
                        pathname: '/pago',
                        params: { orderId: String(pedido.id) },
                      }}
                      style={styles.link}
                    >
                      Pagar con PayPal
                    </Link>
                  )}
              </View>
            ))}

            <View style={styles.pagination}>
              <Pressable
                accessibilityRole="button"
                disabled={pagina <= 1}
                onPress={() => setPagina((actual) => actual - 1)}
                style={[
                  styles.pageButton,
                  pagina <= 1 && styles.disabled,
                ]}
              >
                <Text style={styles.linkText}>Anterior</Text>
              </Pressable>

              <Text style={styles.pageNumber}>
                {pagina} / {ultimaPagina}
              </Text>

              <Pressable
                accessibilityRole="button"
                disabled={pagina >= ultimaPagina}
                onPress={() => setPagina((actual) => actual + 1)}
                style={[
                  styles.pageButton,
                  pagina >= ultimaPagina && styles.disabled,
                ]}
              >
                <Text style={styles.linkText}>Siguiente</Text>
              </Pressable>
            </View>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={cargando}
          style={styles.pageButton}
          onPress={() => setIntento((actual) => actual + 1)}
        >
          <Text style={styles.linkText}>
            {error ? 'Reintentar' : 'Actualizar pedidos'}
          </Text>
        </Pressable>

        <Link href="/catalogo" style={styles.link}>
          Explorar el menú
        </Link>

        <Link href="/" style={styles.link}>
          Volver al inicio
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
    padding: 18,
    marginBottom: 20,
  },
  orderTitle: {
    color: '#191919',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 6,
  },
  date: {
    color: '#686868',
    fontSize: 12,
    marginBottom: 14,
  },
  status: {
    color: '#9A3412',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#686868',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  itemName: {
    flex: 1,
    color: '#252525',
    fontSize: 14,
  },
  amount: {
    color: '#252525',
    fontSize: 14,
  },
  total: {
    color: '#C2410C',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 12,
  },
  address: {
    color: '#686868',
    fontSize: 14,
    lineHeight: 22,
  },
  error: {
    color: '#B91C1C',
    lineHeight: 23,
    marginBottom: 16,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pageButton: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumber: {
    color: '#686868',
  },
  disabled: {
    opacity: 0.35,
  },
  linkText: {
    color: '#C2410C',
    fontWeight: '700',
    fontSize: 14,
  },
  link: {
    color: '#C2410C',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 16,
  },
});