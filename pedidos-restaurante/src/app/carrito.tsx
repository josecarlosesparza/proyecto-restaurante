import { Link, Stack } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '@/context/CartContext';

export default function CarritoScreen() {
  const insets = useSafeAreaInsets();

  const {
    items,
    cantidadTotal,
    totalCentavos,
    cambiarCantidad,
    eliminarProducto,
    vaciarCarrito,
  } = useCart();

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
        <Text style={styles.title}>Tu carrito</Text>

        {items.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyTitle}>
              Tu próximo antojo te espera
            </Text>

            <Text style={styles.description}>
              Todavía no has agregado productos al carrito.
            </Text>

            <Link href="/catalogo" style={styles.link}>
              Explorar el menú
            </Link>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Revisa tus productos y ajusta las cantidades.
            </Text>

            {items.map(({ producto, cantidad }) => (
              <View key={producto.id} style={styles.card}>
                <Text style={styles.productName}>{producto.name}</Text>

                <Text style={styles.description}>
                  Precio unitario: $
                  {Number(producto.price).toFixed(2)} MXN
                </Text>

                <View style={styles.quantityRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Reducir cantidad de ${producto.name}`}
                    accessibilityState={{ disabled: cantidad <= 1 }}
                    disabled={cantidad <= 1}
                    onPress={() =>
                      cambiarCantidad(producto.id, cantidad - 1)
                    }
                    style={[
                      styles.quantityButton,
                      cantidad <= 1 && styles.disabled,
                    ]}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </Pressable>

                  <Text
                    style={styles.quantity}
                    accessibilityLabel={`Cantidad: ${cantidad}`}
                    accessibilityLiveRegion="polite"
                  >
                    {cantidad}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Aumentar cantidad de ${producto.name}`}
                    accessibilityState={{ disabled: cantidad >= 99 }}
                    disabled={cantidad >= 99}
                    onPress={() =>
                      cambiarCantidad(producto.id, cantidad + 1)
                    }
                    style={[
                      styles.quantityButton,
                      cantidad >= 99 && styles.disabled,
                    ]}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </Pressable>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${producto.name} del carrito`}
                  onPress={() => eliminarProducto(producto.id)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeText}>Quitar producto</Text>
                </Pressable>
              </View>
            ))}

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Resumen</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Unidades</Text>
                <Text style={styles.summaryValue}>{cantidadTotal}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total de productos</Text>
                <Text style={styles.total}>
                  ${(totalCentavos / 100).toFixed(2)} MXN
                </Text>
              </View>

              <Text style={styles.note}>
                El importe no incluye un posible cargo de entrega.
                Los precios y la disponibilidad se comprobarán al
                registrar el pedido.
              </Text>
            </View>

            <Link href="/catalogo" style={styles.link}>
              Seguir comprando
            </Link>
            <Link href="/confirmar-pedido" style={styles.link}>
            Continuar con el pedido
            </Link>

            <Pressable
              accessibilityRole="button"
              onPress={vaciarCarrito}
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>Vaciar carrito</Text>
            </Pressable>
          </>
        )}
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
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    color: '#686868',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D8CB',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  emptyTitle: {
    color: '#252525',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 12,
  },
  productName: {
    color: '#191919',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#686868',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  quantityButton: {
    backgroundColor: '#FFF0E3',
    borderRadius: 12,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    color: '#C2410C',
    fontSize: 24,
    fontWeight: '700',
  },
  quantity: {
    color: '#252525',
    fontSize: 18,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  removeButton: {
    minHeight: 48,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: '#FFF0E3',
    borderWidth: 1,
    borderColor: '#F4D7BD',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  summaryTitle: {
    color: '#9A3412',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  summaryLabel: {
    color: '#705B4C',
    fontSize: 15,
  },
  summaryValue: {
    color: '#252525',
    fontSize: 15,
    fontWeight: '600',
  },
  totalLabel: {
    color: '#252525',
    fontSize: 16,
    fontWeight: '700',
  },
  total: {
    color: '#C2410C',
    fontSize: 20,
    fontWeight: '800',
  },
  note: {
    color: '#705B4C',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 4,
  },
  link: {
    color: '#C2410C',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 16,
  },
});