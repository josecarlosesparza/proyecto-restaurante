import { Link, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '@/context/CartContext';
import { apiRequest } from '@/services/api';
import { obtenerToken } from '@/services/session';
import AddressSearch from '@/components/AddressSearch';

type Pedido = {
  id: number;
  total: string;
  status: string;
  payment_status: string;
  delivery_address: string;
};

type RespuestaPedido = {
  message: string;
  order: Pedido;
};

export default function ConfirmarPedidoScreen() {
  const insets = useSafeAreaInsets();
  const enviandoRef = useRef(false);

  const { items, totalCentavos, vaciarCarrito } = useCart();

  const [direccion, setDireccion] = useState('');
  const [referencias, setReferencias] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [pedidoCreado, setPedidoCreado] = useState<Pedido | null>(null);

  async function confirmarPedido() {
    if (enviandoRef.current || pedidoCreado) return;

    setError('');

    if (items.length === 0) {
      setError('Agrega productos al carrito antes de continuar.');
      return;
    }

    if (direccion.trim().length < 10) {
      setError('Escribe una dirección completa de al menos 10 caracteres.');
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);

    try {
      const token = await obtenerToken();

      if (!token) {
        throw new Error(
          'Debes iniciar sesión antes de registrar tu pedido. Puedes volver al inicio; tu carrito se conservará mientras la aplicación siga abierta.'
        );
      }

      const respuesta = await apiRequest<RespuestaPedido>('/orders', {
        method: 'POST',
        token,
        body: {
          delivery_address: direccion.trim(),
          delivery_references: referencias.trim() || null,
          items: items.map(({ producto, cantidad }) => ({
            product_id: producto.id,
            quantity: cantidad,
          })),
        },
      });

      setPedidoCreado(respuesta.order);
      vaciarCarrito();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo registrar el pedido.'
      );
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 32,
          },
        ]}
      >
        <View style={styles.page}>
          <Text style={styles.brand}>TOKIS BURGER</Text>

          {pedidoCreado ? (
            <>
              <Text style={styles.title}>¡Pedido registrado!</Text>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  Pedido #{pedidoCreado.id}
                </Text>

                <Text style={styles.description}>
                  Tu pedido se registró correctamente.
                </Text>

                <Text style={styles.label}>Dirección de entrega</Text>
                <Text style={styles.description}>
                  {pedidoCreado.delivery_address}
                </Text>

                <Text style={styles.total}>
                  Total: ${Number(pedidoCreado.total).toFixed(2)} MXN
                </Text>

                <Text style={styles.note}>
                  Pago pendiente. Este registro todavía no realiza
                  ningún cobro.
                </Text>
              </View>

              <Link href="/catalogo" style={styles.link}>
                Volver al menú
              </Link>
                <Link href="/mis-pedidos" style={styles.link}>
                    Consultar mis pedidos
                </Link>

              <Link href="/" style={styles.link}>
                Ir al inicio
              </Link>
            </>
          ) : items.length === 0 ? (
            <>
              <Text style={styles.title}>Tu carrito está vacío</Text>
              <Text style={styles.description}>
                Agrega productos antes de registrar un pedido.
              </Text>

              <Link href="/catalogo" style={styles.link}>
                Explorar el menú
              </Link>
            </>
          ) : (
            <>
              <Text style={styles.title}>Confirma tu pedido</Text>
              <Text style={styles.description}>
                Revisa tus productos e indica dónde entregarlos.
              </Text>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Tus productos</Text>

                {items.map(({ producto, cantidad }) => (
                  <View key={producto.id} style={styles.productRow}>
                    <Text style={styles.productName}>
                      {cantidad} × {producto.name}
                    </Text>

                    <Text style={styles.unitPrice}>
                      ${Number(producto.price).toFixed(2)} c/u
                    </Text>
                  </View>
                ))}

                <Text style={styles.total}>
                  Total estimado: ${(totalCentavos / 100).toFixed(2)} MXN
                </Text>

                <Text style={styles.note}>
                  El servidor comprobará los precios y la disponibilidad
                  al confirmar. Este importe corresponde a los productos,
                  sin cargo de entrega.
                </Text>
              </View>

              <AddressSearch
                disabled={enviando}
                onSelect={(direccionSeleccionada) => {
                  setDireccion(direccionSeleccionada);
                  setError('');
                }}
              />

              <Text style={styles.label}>Dirección de entrega *</Text>
              <TextInput
                accessibilityLabel="Dirección de entrega"
                style={[styles.input, styles.multiline]}
                placeholder="Calle, número, colonia y ciudad"
                placeholderTextColor="#858585"
                multiline
                maxLength={500}
                editable={!enviando}
                value={direccion}
                onChangeText={setDireccion}
              />

              <Text style={styles.label}>Referencias · opcional</Text>
              <TextInput
                accessibilityLabel="Referencias para la entrega"
                style={[styles.input, styles.multiline]}
                placeholder="Color de puerta, entre calles u otra referencia"
                placeholderTextColor="#858585"
                multiline
                maxLength={500}
                editable={!enviando}
                value={referencias}
                onChangeText={setReferencias}
              />

              {error ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={styles.error}
                >
                  {error}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: enviando,
                  busy: enviando,
                }}
                disabled={enviando}
                onPress={confirmarPedido}
                style={[
                  styles.button,
                  enviando && { opacity: 0.7 },
                ]}
              >
                {enviando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>
                    Confirmar pedido
                  </Text>
                )}
              </Pressable>

              {!enviando && (
                <>
                  <Link href="/carrito" style={styles.link}>
                    Volver al carrito
                  </Link>

                  <Link href="/" style={styles.link}>
                    Ir al inicio / iniciar sesión
                  </Link>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D8CB',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#252525',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
  },
  productRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  productName: {
    color: '#252525',
    fontSize: 15,
    flexShrink: 1,
  },
  unitPrice: {
    color: '#686868',
    fontSize: 14,
  },
  total: {
    color: '#C2410C',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
  },
  note: {
    color: '#705B4C',
    fontSize: 12,
    lineHeight: 20,
    marginTop: 12,
  },
  label: {
    color: '#252525',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    color: '#252525',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEDEDE',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  error: {
    color: '#B91C1C',
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 12,
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
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  link: {
    color: '#C2410C',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 16,
  },
});