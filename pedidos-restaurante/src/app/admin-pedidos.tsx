import { Stack, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

type Detalle = {
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
  delivery_references: string | null;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  items: Detalle[];
};

type RespuestaPedidos = {
  data: Pedido[];
  last_page: number;
};

const estados: Record<string, string> = {
  received: 'Recibido',
  preparing: 'En preparación',
  out_for_delivery: 'En reparto',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const siguientes: Record<string, { status: string; texto: string }> = {
  received: {
    status: 'preparing',
    texto: 'Iniciar preparación',
  },
  preparing: {
    status: 'out_for_delivery',
    texto: 'Enviar a reparto',
  },
  out_for_delivery: {
    status: 'delivered',
    texto: 'Marcar como entregado',
  },
};

const pagos: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  failed: 'No completado',
  refunded: 'Reembolsado',
};

export default function AdminPedidosScreen() {
  const insets = useSafeAreaInsets();
  const actualizandoRef = useRef(false);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pagina, setPagina] = useState(1);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setError('');
      setAutorizado(false);

      try {
        const token = await obtenerToken();

        if (!token) {
          throw new Error('Inicia sesión con una cuenta administradora.');
        }

        const perfil = await apiRequest<{
          user: { role: string };
        }>('/me', { token });

        if (perfil.user.role !== 'admin') {
          throw new Error('No tienes permiso para administrar pedidos.');
        }

        const respuesta = await apiRequest<RespuestaPedidos>(
          `/admin/orders?page=${pagina}`,
          { token }
        );

        if (activo) {
          setPedidos(respuesta.data);
          setUltimaPagina(respuesta.last_page);
          setAutorizado(true);
        }
      } catch (error) {
        if (activo) {
          setError(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar los pedidos.'
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

  async function cambiarEstado(pedido: Pedido) {
    const siguiente = siguientes[pedido.status];

    if (!siguiente || actualizandoRef.current) return;

    actualizandoRef.current = true;
    setActualizandoId(pedido.id);
    setError('');
    setMensaje('');

    try {
      const token = await obtenerToken();

      if (!token) {
        throw new Error('Tu sesión no está disponible.');
      }

      const respuesta = await apiRequest<{
        message: string;
        order: Pedido;
      }>(`/admin/orders/${pedido.id}/status`, {
        method: 'PUT',
        token,
        body: { status: siguiente.status },
      });

      setPedidos((anteriores) =>
        anteriores.map((item) =>
          item.id === respuesta.order.id ? respuesta.order : item
        )
      );

      setMensaje(
        `Pedido #${pedido.id}: ${
          estados[respuesta.order.status] ?? respuesta.order.status
        }.`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el pedido.'
      );
    } finally {
      actualizandoRef.current = false;
      setActualizandoId(null);
    }
  }

  const ocupado = cargando || actualizandoId !== null;

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
        <Text style={styles.title}>Administrar pedidos</Text>

        <Text style={styles.description}>
          Consulta las órdenes y actualiza su avance.
        </Text>

        {mensaje ? (
          <Text style={styles.success} accessibilityLiveRegion="polite">
            {mensaje}
          </Text>
        ) : null}

        {error ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </Text>
        ) : null}

        {cargando ? (
          <ActivityIndicator size="large" color="#C2410C" />
        ) : autorizado ? (
          <>
            {pedidos.length === 0 && (
              <Text style={styles.description}>
                Todavía no hay pedidos registrados.
              </Text>
            )}

            {pedidos.map((pedido) => {
              const siguiente = siguientes[pedido.status];

              return (
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
                    Pago: {pagos[pedido.payment_status] ??
                      pedido.payment_status}
                  </Text>

                  <Text style={styles.label}>Cliente</Text>
                  <Text style={styles.description}>
                    {pedido.user.name}{'\n'}
                    {pedido.user.email}
                  </Text>

                  <Text style={styles.label}>Entrega</Text>
                  <Text style={styles.description}>
                    {pedido.delivery_address}
                  </Text>

                  {pedido.delivery_references ? (
                    <Text style={styles.description}>
                      Referencias: {pedido.delivery_references}
                    </Text>
                  ) : null}

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

                  {siguiente ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${siguiente.texto}, pedido ${pedido.id}`}
                      accessibilityState={{
                        disabled: ocupado,
                        busy: actualizandoId === pedido.id,
                      }}
                      disabled={ocupado}
                      onPress={() => cambiarEstado(pedido)}
                      style={[
                        styles.button,
                        ocupado && styles.disabled,
                      ]}
                    >
                      {actualizandoId === pedido.id ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>
                          {siguiente.texto}
                        </Text>
                      )}
                    </Pressable>
                  ) : (
                    <Text style={styles.description}>
                      Este pedido no tiene más cambios de estado disponibles.
                    </Text>
                  )}
                </View>
              );
            })}

            <View style={styles.pagination}>
              <Pressable
                accessibilityRole="button"
                disabled={ocupado || pagina <= 1}
                onPress={() => {
                  setMensaje('');
                  setPagina((actual) => actual - 1);
                }}
                style={[
                  styles.linkButton,
                  (ocupado || pagina <= 1) && styles.disabled,
                ]}
              >
                <Text style={styles.linkText}>Anterior</Text>
              </Pressable>

              <Text style={styles.date}>
                {pagina} / {ultimaPagina}
              </Text>

              <Pressable
                accessibilityRole="button"
                disabled={ocupado || pagina >= ultimaPagina}
                onPress={() => {
                  setMensaje('');
                  setPagina((actual) => actual + 1);
                }}
                style={[
                  styles.linkButton,
                  (ocupado || pagina >= ultimaPagina) &&
                    styles.disabled,
                ]}
              >
                <Text style={styles.linkText}>Siguiente</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={ocupado}
          style={styles.linkButton}
          onPress={() => {
            setMensaje('');
            setIntento((actual) => actual + 1);
          }}
        >
          <Text style={styles.linkText}>
            {error ? 'Reintentar / actualizar' : 'Actualizar pedidos'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={actualizandoId !== null}
          style={styles.linkButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}
        >
          <Text style={styles.linkText}>Volver al inicio</Text>
        </Pressable>
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
    marginBottom: 12,
  },
  description: {
    color: '#686868',
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  status: {
    color: '#9A3412',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  label: {
    color: '#252525',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
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
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#C2410C',
    minHeight: 54,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.4,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  linkButton: {
    minHeight: 48,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    color: '#C2410C',
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 12,
    lineHeight: 23,
    marginBottom: 18,
  },
  success: {
    color: '#166534',
    backgroundColor: '#DCFCE7',
    padding: 14,
    borderRadius: 12,
    lineHeight: 23,
    marginBottom: 18,
  },
});