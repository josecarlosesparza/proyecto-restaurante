import { Stack, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '@/services/api';
import { obtenerToken } from '@/services/session';

type Categoria = {
  id: number;
  name: string;
};

type Producto = {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  is_available: boolean;
  category: Categoria;
};

type Usuario = {
  id: number;
  role: 'admin' | 'customer';
};

type RespuestaProducto = {
  message: string;
  product: Producto;
};

export default function AdminProductosScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const guardandoRef = useRef(false);

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [autorizado, setAutorizado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [intento, setIntento] = useState(0);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [disponible, setDisponible] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargar() {
      setCargando(true);
      setErrorCarga('');
      setAutorizado(false);

      try {
        const token = await obtenerToken();

        if (!token) {
          throw new Error('Inicia sesión con una cuenta administradora.');
        }

        const perfil = await apiRequest<{ user: Usuario }>('/me', {
          token,
        });

        if (perfil.user.role !== 'admin') {
          throw new Error('Esta sección está reservada al administrador.');
        }

        const [respuestaCategorias, respuestaProductos] = await Promise.all([
          apiRequest<{ categories: Categoria[] }>('/categories'),
          apiRequest<{ products: Producto[] }>('/admin/products', {
            token,
          }),
        ]);

        if (activo) {
          setCategorias(respuestaCategorias.categories);
          setProductos(respuestaProductos.products);
          setAutorizado(true);
        }
      } catch (error) {
        if (activo) {
          setErrorCarga(
            error instanceof Error
              ? error.message
              : 'No se pudo cargar la administración.'
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
  }, [intento]);

  function limpiarFormulario() {
    setEditandoId(null);
    setCategoriaId(null);
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setImagenUrl('');
    setDisponible(true);
    setErrorFormulario('');
  }

  function editar(producto: Producto) {
    limpiarFormulario();
    setMensaje('');
    setEditandoId(producto.id);
    setCategoriaId(producto.category_id);
    setNombre(producto.name);
    setDescripcion(producto.description ?? '');
    setPrecio(producto.price);
    setImagenUrl(producto.image_url ?? '');
    setDisponible(producto.is_available);

    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function guardar() {
    if (guardandoRef.current || !autorizado) return;

    setErrorFormulario('');
    setMensaje('');

    const precioNormalizado = precio.trim().replace(',', '.');

    if (!categoriaId || !nombre.trim() || !precioNormalizado) {
      setErrorFormulario('Completa categoría, nombre y precio.');
      return;
    }

    if (
      !/^\d{1,8}(\.\d{1,2})?$/.test(precioNormalizado) ||
      Number(precioNormalizado) <= 0
    ) {
      setErrorFormulario(
        'Escribe un precio mayor que cero, con máximo dos decimales.'
      );
      return;
    }

    if (imagenUrl.trim() && !/^https:\/\/\S+$/i.test(imagenUrl.trim())) {
      setErrorFormulario('La dirección de la imagen debe comenzar con HTTPS.');
      return;
    }

    guardandoRef.current = true;
    setGuardando(true);

    try {
      const token = await obtenerToken();

      if (!token) {
        throw new Error('Tu sesión no está disponible. Vuelve a iniciar sesión.');
      }

      const respuesta = await apiRequest<RespuestaProducto>(
        editandoId === null
          ? '/admin/products'
          : `/admin/products/${editandoId}`,
        {
          method: editandoId === null ? 'POST' : 'PUT',
          token,
          body: {
            category_id: categoriaId,
            name: nombre.trim(),
            description: descripcion.trim() || null,
            price: precioNormalizado,
            image_url: imagenUrl.trim() || null,
            is_available: disponible,
          },
        }
      );

      setProductos((anteriores) =>
        [
          ...anteriores.filter(
            (producto) => producto.id !== respuesta.product.id
          ),
          respuesta.product,
        ].sort((a, b) => a.name.localeCompare(b.name))
      );

      limpiarFormulario();
      setMensaje(respuesta.message);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error) {
      setErrorFormulario(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el producto.'
      );
    } finally {
      guardandoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        ref={scrollRef}
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
          <Text style={styles.title}>Administrar menú</Text>
          <Text style={styles.subtitle}>
            Crea productos y actualiza su disponibilidad.
          </Text>

          {cargando ? (
            <ActivityIndicator size="large" color="#C2410C" />
          ) : errorCarga ? (
            <View style={styles.card}>
              <Text style={styles.error}>{errorCarga}</Text>

              <Pressable
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={() => setIntento((anterior) => anterior + 1)}
              >
                <Text style={styles.secondaryText}>Reintentar</Text>
              </Pressable>
            </View>
          ) : autorizado ? (
            <>
              {mensaje ? (
                <Text
                  accessibilityLiveRegion="polite"
                  style={styles.success}
                >
                  {mensaje}
                </Text>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {editandoId === null
                    ? 'Nuevo producto'
                    : `Editar producto #${editandoId}`}
                </Text>

                <Text style={styles.label}>Categoría *</Text>
                <View style={styles.categories}>
                  {categorias.map((categoria) => (
                    <Pressable
                      key={categoria.id}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: categoriaId === categoria.id,
                        disabled: guardando,
                      }}
                      disabled={guardando}
                      onPress={() => setCategoriaId(categoria.id)}
                      style={[
                        styles.chip,
                        categoriaId === categoria.id &&
                          styles.chipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          categoriaId === categoria.id &&
                            styles.chipTextSelected,
                        ]}
                      >
                        {categoria.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  accessibilityLabel="Nombre del producto"
                  style={styles.input}
                  placeholder="Ejemplo: Tokis BBQ"
                  placeholderTextColor="#858585"
                  maxLength={150}
                  editable={!guardando}
                  value={nombre}
                  onChangeText={setNombre}
                />

                <Text style={styles.label}>Descripción</Text>
                <TextInput
                  accessibilityLabel="Descripción del producto"
                  style={[styles.input, styles.multiline]}
                  placeholder="Ingredientes y características"
                  placeholderTextColor="#858585"
                  multiline
                  maxLength={2000}
                  editable={!guardando}
                  value={descripcion}
                  onChangeText={setDescripcion}
                />

                <Text style={styles.label}>Precio en MXN *</Text>
                <TextInput
                  accessibilityLabel="Precio en pesos mexicanos"
                  style={styles.input}
                  placeholder="109.00"
                  placeholderTextColor="#858585"
                  keyboardType="decimal-pad"
                  editable={!guardando}
                  value={precio}
                  onChangeText={setPrecio}
                />

                <Text style={styles.label}>URL de imagen · opcional</Text>
                <TextInput
                  accessibilityLabel="Dirección HTTPS de la imagen"
                  style={styles.input}
                  placeholder="https://..."
                  placeholderTextColor="#858585"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  maxLength={2048}
                  editable={!guardando}
                  value={imagenUrl}
                  onChangeText={setImagenUrl}
                />

                <View style={styles.switchRow}>
                  <Text style={styles.switchText}>
                    Disponible para la venta
                  </Text>
                  <Switch
                    accessibilityLabel="Disponible para la venta"
                    value={disponible}
                    onValueChange={setDisponible}
                    disabled={guardando}
                    trackColor={{ false: '#D1D5DB', true: '#FDBA74' }}
                    thumbColor={disponible ? '#C2410C' : '#F3F4F6'}
                  />
                </View>

                {errorFormulario ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={styles.error}
                  >
                    {errorFormulario}
                  </Text>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: guardando,
                    busy: guardando,
                  }}
                  disabled={guardando}
                  onPress={guardar}
                  style={[
                    styles.button,
                    guardando && styles.disabled,
                  ]}
                >
                  {guardando ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {editandoId === null
                        ? 'Crear producto'
                        : 'Guardar cambios'}
                    </Text>
                  )}
                </Pressable>

                {editandoId !== null && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={guardando}
                    style={styles.secondaryButton}
                    onPress={() => {
                      limpiarFormulario();
                      setMensaje('');
                    }}
                  >
                    <Text style={styles.secondaryText}>
                      Cancelar edición
                    </Text>
                  </Pressable>
                )}
              </View>

              <Text style={styles.sectionTitle}>
                Productos registrados ({productos.length})
              </Text>

              {productos.length === 0 && (
                <Text style={styles.subtitle}>
                  Todavía no hay productos registrados.
                </Text>
              )}

              {productos.map((producto) => (
                <View key={producto.id} style={styles.card}>
                  <Text style={styles.productName}>{producto.name}</Text>
                  <Text style={styles.detail}>
                    {producto.category.name}
                  </Text>
                  <Text style={styles.price}>
                    ${Number(producto.price).toFixed(2)} MXN
                  </Text>
                  <Text
                    style={[
                      styles.status,
                      !producto.is_available && styles.inactive,
                    ]}
                  >
                    {producto.is_available
                      ? 'Disponible'
                      : 'No disponible'}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${producto.name}`}
                    disabled={guardando}
                    style={styles.secondaryButton}
                    onPress={() => editar(producto)}
                  >
                    <Text style={styles.secondaryText}>Editar</Text>
                  </Pressable>
                </View>
              ))}
            </>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={guardando}
            style={styles.secondaryButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/');
              }
            }}
          >
            <Text style={styles.secondaryText}>Volver al inicio</Text>
          </Pressable>
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
    marginBottom: 8,
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
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#252525',
    fontSize: 21,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    color: '#252525',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    color: '#252525',
    backgroundColor: '#FFFCF9',
    borderWidth: 1,
    borderColor: '#DEDEDE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E8D8CB',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chipSelected: {
    backgroundColor: '#C2410C',
    borderColor: '#C2410C',
  },
  chipText: {
    color: '#705B4C',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  switchText: {
    flex: 1,
    color: '#252525',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#C2410C',
    borderRadius: 14,
    minHeight: 54,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
  secondaryButton: {
    minHeight: 48,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#C2410C',
    fontWeight: '700',
    fontSize: 15,
  },
  error: {
    color: '#B91C1C',
    lineHeight: 23,
    marginBottom: 16,
  },
  success: {
    color: '#166534',
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 12,
    lineHeight: 23,
    marginBottom: 20,
  },
  productName: {
    color: '#191919',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 6,
  },
  detail: {
    color: '#686868',
    fontSize: 14,
    marginBottom: 8,
  },
  price: {
    color: '#C2410C',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  status: {
    color: '#166534',
    fontWeight: '600',
  },
  inactive: {
    color: '#9A3412',
  },
});