import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { apiRequest } from '@/services/api';
import {
  guardarToken,
  obtenerToken,
  eliminarToken,
} from '@/services/session';
import ActivarNotificaciones from '@/components/ActivarNotificaciones';
import { desvincularNotificaciones } from '@/services/notifications';

type Usuario = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'customer';
};

type LoginResponse = {
  message: string;
  token: string;
  token_type: string;
  user: Usuario;
};

function mostrarMensaje(titulo: string, mensaje: string) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensaje}`);
  } else {
    Alert.alert(titulo, mensaje);
  }
}

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  async function iniciarSesion() {
    if (enviando) return;

    if (!correo.trim() || !password) {
      mostrarMensaje(
        'Campos incompletos',
        'Escribe tu correo y contraseña.'
      );
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await apiRequest<LoginResponse>('/login', {
        method: 'POST',
        body: {
          email: correo.trim().toLowerCase(),
          password,
        },
      });

      await guardarToken(respuesta.token);

      setPassword('');
      setMostrarPassword(false);
      setUsuario(respuesta.user);
    } catch (error) {
      mostrarMensaje(
        'No se pudo iniciar sesión',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.'
      );
    } finally {
      setEnviando(false);
    }
  }

  async function cerrarSesion() {
    if (enviando) return;

    setEnviando(true);

    try {
      const token = await obtenerToken();

      if (token) {
        // Primero desvincular el teléfono usando la sesión vigente.
        await desvincularNotificaciones(token);

        // Después invalidar la sesión en Laravel.
        await apiRequest<{ message: string }>('/logout', {
          method: 'POST',
          token,
        });
      }

      await eliminarToken();

      setUsuario(null);
      setCorreo('');
      setPassword('');
      setMostrarPassword(false);
    } catch (error) {
      mostrarMensaje(
        'No se pudo completar el cierre de sesión',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado. Intenta nuevamente.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: 'Acceso', headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.page}>
          <View style={styles.brand}>
            <View style={styles.brandIcon} accessible={false}>
              <View style={styles.bunTop} />
              <View style={styles.filling} />
              <View style={styles.bunBottom} />
            </View>

            <Text style={styles.brandText}>Tokis Burger</Text>
          </View>

          <Image
            source={require('../../assets/images/login-comida.png')}
            style={styles.hero}
            resizeMode="contain"
            accessible={false}
          />

          {usuario ? (
            <View>
              <Text style={styles.title}>
                ¡Bienvenido, {usuario.name}!
              </Text>

              <Text style={styles.subtitle}>
                Has iniciado sesión correctamente.
              </Text>

              <View style={styles.profile}>
                <Text style={styles.label}>Tu correo</Text>
                <Text style={styles.profileEmail}>{usuario.email}</Text>

                <Text style={styles.role}>
                  {usuario.role === 'admin'
                    ? 'Administrador'
                    : 'Cliente'}
                </Text>
              </View>

              <Link href="/catalogo" style={styles.menuLink}>
                Explorar el menú
              </Link>

              <Link href="/mis-pedidos" style={styles.menuLink}>
                Mis pedidos
              </Link>

              {usuario.role === 'admin' && (
                <>
                  <Link href="/admin-productos" style={styles.menuLink}>
                    Administrar productos
                  </Link>

                  <Link href="/admin-pedidos" style={styles.menuLink}>
                    Administrar pedidos
                  </Link>
                </>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: enviando,
                  busy: enviando,
                }}
                disabled={enviando}
                onPress={cerrarSesion}
                style={({ pressed }) => [
                  styles.button,
                  (pressed || enviando) && styles.buttonPressed,
                ]}
              >
                {enviando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Cerrar sesión</Text>
                )}
              </Pressable>
              <ActivarNotificaciones />
            </View>
          ) : (
            <View>
              <Text style={styles.title}>¡Qué gusto verte!</Text>

              <Text style={styles.subtitle}>
                Inicia sesión para continuar.
              </Text>

              <Link href="/catalogo" style={styles.menuLink}>
                Explorar el menú
              </Link>

              <Text style={styles.label}>Correo electrónico</Text>

              <View style={styles.inputContainer}>
                <View style={styles.mailIcon} accessible={false}>
                  <View style={styles.mailFlap} />
                </View>

                <TextInput
                  accessibilityLabel="Correo electrónico"
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor="#92959B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  maxLength={255}
                  editable={!enviando}
                  value={correo}
                  onChangeText={setCorreo}
                />
              </View>

              <Text style={styles.label}>Contraseña</Text>

              <View style={styles.inputContainer}>
                <View style={styles.lockIcon} accessible={false}>
                  <View style={styles.lockArc} />
                  <View style={styles.lockBody}>
                    <View style={styles.lockDot} />
                  </View>
                </View>

                <TextInput
                  accessibilityLabel="Contraseña"
                  style={styles.input}
                  placeholder="Escribe tu contraseña"
                  placeholderTextColor="#92959B"
                  secureTextEntry={!mostrarPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={128}
                  editable={!enviando}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="go"
                  onSubmitEditing={iniciarSesion}
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  disabled={enviando}
                  onPress={() =>
                    setMostrarPassword((anterior) => !anterior)
                  }
                  style={styles.eyeButton}
                >
                  <View style={styles.eye}>
                    <View style={styles.pupil} />
                  </View>

                  {mostrarPassword && (
                    <View style={styles.eyeSlash} />
                  )}
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled: enviando,
                  busy: enviando,
                }}
                disabled={enviando}
                onPress={iniciarSesion}
                style={({ pressed }) => [
                  styles.button,
                  (pressed || enviando) && styles.buttonPressed,
                ]}
              >
                {enviando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Ingresar</Text>
                )}
              </Pressable>

              <View style={styles.registerRow}>
                <Text style={styles.registerText}>
                  ¿No tienes cuenta?
                </Text>

                <Link href="/registro" style={styles.registerLink}>
                  Regístrate
                </Link>
              </View>
            </View>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  page: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brand: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  brandText: {
    flexShrink: 1,
    color: '#191919',
    fontSize: 20,
    fontWeight: '800',
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
  hero: {
    width: '70%',
    maxWidth: 240,
    height: 170,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#191919',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  subtitle: {
    color: '#686868',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
  },
  menuLink: {
    color: '#C2410C',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  label: {
    color: '#252525',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 9,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEDEDE',
    borderRadius: 14,
    paddingLeft: 16,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: '#252525',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 17,
  },
  mailIcon: {
    width: 24,
    height: 18,
    borderWidth: 2,
    borderColor: '#85888C',
    borderRadius: 4,
    overflow: 'hidden',
  },
  mailFlap: {
    position: 'absolute',
    width: 14,
    height: 14,
    top: -8,
    left: 3,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#85888C',
    transform: [{ rotate: '45deg' }],
  },
  lockIcon: {
    width: 24,
    height: 25,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lockArc: {
    position: 'absolute',
    top: 0,
    width: 13,
    height: 13,
    borderWidth: 2,
    borderColor: '#85888C',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lockBody: {
    width: 21,
    height: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#85888C',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockDot: {
    width: 3,
    height: 6,
    backgroundColor: '#85888C',
    borderRadius: 2,
  },
  eyeButton: {
    width: 48,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    width: 24,
    height: 16,
    borderWidth: 2,
    borderColor: '#85888C',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#85888C',
  },
  eyeSlash: {
    position: 'absolute',
    width: 28,
    height: 2,
    backgroundColor: '#85888C',
    transform: [{ rotate: '-40deg' }],
  },
  button: {
    minHeight: 58,
    backgroundColor: '#C2410C',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    marginTop: 22,
  },
  registerText: {
    color: '#686868',
    fontSize: 15,
  },
  registerLink: {
    color: '#C2410C',
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 12,
  },
  profile: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEDEDE',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },
  profileEmail: {
    color: '#686868',
    fontSize: 16,
  },
  role: {
    color: '#C2410C',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
});