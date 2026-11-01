import { Link, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/CartContext';
import { apiRequest } from '@/services/api';

type Categoria = {
  id: number;
  name: string;
};

type Producto = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_available: boolean;
  category: Categoria;
};

export default function CatalogoScreen() {
  const insets = useSafeAreaInsets();
  const { agregarProducto, cantidadTotal } = useCart();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;

    async function cargarCatalogo() {
      setCargando(true);
      setError('');

      try {
        const [respuestaCategorias, respuestaProductos] = await Promise.all([
          apiRequest<{ categories: Categoria[] }>('/categories'),
          apiRequest<{ products: Producto[] }>('/products'),
        ]);

        if (activo) {
          setCategorias(respuestaCategorias.categories);
          setProductos(respuestaProductos.products);
        }
      } catch (error) {
        if (activo) {
          setError(
            error instanceof Error
              ? error.message
              : 'No se pudo cargar el catálogo.'
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarCatalogo();

    return () => {
      activo = false;
    };
  }, [intento]);

  const productosVisibles =
    categoriaSeleccionada === null
      ? productos
      : productos.filter(
          (producto) => producto.category.id === categoriaSeleccionada
        );

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
        <View style={styles.brand}>
          <View style={styles.brandIcon} accessible={false}>
            <View style={styles.bunTop} />
            <View style={styles.filling} />
            <View style={styles.bunBottom} />
          </View>

          <Text style={styles.brandText}>Tokis Burger</Text>
        </View>

        <Text style={styles.title}>Nuestro menú</Text>
        <Text style={styles.subtitle}>
          Encuentra tu próximo antojo.
        </Text>

        <Text style={styles.cartSummary} accessibilityLiveRegion="polite">
          Productos en tu carrito: {cantidadTotal}
        </Text>
        
        <Link href="/carrito" style={styles.backLink}>
          Ver carrito
        </Link>

        {cargando ? (
          <View style={styles.messageBox}>
            <ActivityIndicator size="large" color="#C2410C" />
            <Text style={styles.messageText}>Cargando productos…</Text>
          </View>
        ) : error ? (
          <View style={styles.messageBox}>
            <Text style={styles.errorText}>{error}</Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setIntento((valor) => valor + 1)}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categories}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  selected: categoriaSeleccionada === null,
                }}
                onPress={() => setCategoriaSeleccionada(null)}
                style={[
                  styles.chip,
                  categoriaSeleccionada === null && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    categoriaSeleccionada === null &&
                      styles.chipTextSelected,
                  ]}
                >
                  Todos
                </Text>
              </Pressable>

              {categorias.map((categoria) => {
                const seleccionada =
                  categoriaSeleccionada === categoria.id;

                return (
                  <Pressable
                    key={categoria.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: seleccionada }}
                    onPress={() =>
                      setCategoriaSeleccionada(categoria.id)
                    }
                    style={[
                      styles.chip,
                      seleccionada && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        seleccionada && styles.chipTextSelected,
                      ]}
                    >
                      {categoria.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.count}>
              {productosVisibles.length}{' '}
              {productosVisibles.length === 1 ? 'producto' : 'productos'}
            </Text>

            {productosVisibles.length === 0 ? (
              <Text style={styles.messageText}>
                No hay productos disponibles en esta categoría.
              </Text>
            ) : (
              productosVisibles.map((producto) => (
                <View key={producto.id} style={styles.card}>
                  {producto.image_url ? (
                    <Image
                      source={{ uri: producto.image_url }}
                      style={styles.productImage}
                      resizeMode="cover"
                      accessibilityLabel={producto.name}
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.placeholderText}>
                        Imagen próximamente
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <Text style={styles.categoryLabel}>
                      {producto.category.name}
                    </Text>

                    <Text style={styles.productName}>
                      {producto.name}
                    </Text>

                    {producto.description ? (
                      <Text style={styles.description}>
                        {producto.description}
                      </Text>
                    ) : null}

                    <Text style={styles.price}>
                      ${Number(producto.price).toFixed(2)} MXN
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Agregar ${producto.name} al carrito`}
                      onPress={() => agregarProducto(producto)}
                      style={({ pressed }) => [
                        styles.addButton,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={styles.buttonText}>Agregar al carrito</Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        <Link href="/" style={styles.backLink}>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  brandText: {
    color: '#191919',
    fontSize: 20,
    fontWeight: '800',
    flexShrink: 1,
  },
  brandIcon: {
    width: 34,
    height: 36,
    justifyContent: 'center',
    gap: 3,
  },
  bunTop: {
    height: 15,
    borderWidth: 2,
    borderColor: '#C2410C',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  filling: {
    height: 5,
    borderWidth: 2,
    borderColor: '#C2410C',
    borderRadius: 3,
  },
  bunBottom: {
    height: 8,
    borderWidth: 2,
    borderColor: '#C2410C',
    borderRadius: 4,
  },
  title: {
    color: '#191919',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#686868',
    fontSize: 16,
    marginBottom: 24,
  },
  categories: {
    gap: 10,
    paddingBottom: 12,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D8CB',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  chipSelected: {
    backgroundColor: '#C2410C',
    borderColor: '#C2410C',
  },
  chipText: {
    color: '#705B4C',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  count: {
    color: '#686868',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D8CB',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
  },
  productImage: {
    width: '100%',
    height: 170,
  },
  imagePlaceholder: {
    height: 110,
    backgroundColor: '#FFF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#9A3412',
    fontSize: 13,
  },
  cardBody: {
    padding: 18,
  },
  categoryLabel: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  productName: {
    color: '#191919',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#686868',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  price: {
    color: '#C2410C',
    fontSize: 20,
    fontWeight: '800',
  },
  messageBox: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 16,
  },
  messageText: {
    color: '#686868',
    fontSize: 15,
    textAlign: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#C2410C',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  backLink: {
    color: '#C2410C',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 16,
    marginTop: 8,
  },
  cartSummary: {
    color: '#9A3412',
    backgroundColor: '#FFF0E3',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#C2410C',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 16,
  },
});