import { Link, Stack, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { apiRequest } from '@/services/api';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIVACY_NOTICE_VERSION = '1.0';

type RegistroResponse = {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export default function RegistroScreen() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const insets = useSafeAreaInsets();

  async function registrar() {
    if (enviando) return;

    if (!nombre.trim() || !correo.trim() || !password || !confirmacion) {
      Alert.alert('Campos incompletos', 'Completa todos los campos.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      Alert.alert('Correo inválido', 'Escribe un correo electrónico válido.');
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Contraseña corta',
        'La contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

    if (password !== confirmacion) {
      Alert.alert(
        'Contraseñas diferentes',
        'Las contraseñas deben coincidir.'
      );
      return;
    }

    if (!consentimiento) {
      Alert.alert(
        'Consentimiento requerido',
        'Para crear tu cuenta, debes aceptar el uso de tus datos personales descrito en el aviso de privacidad.'
      );
      return;
    }

    setEnviando(true);

    try {
      const respuesta = await apiRequest<RegistroResponse>('/register', {
        method: 'POST',
        body: {
          name: nombre.trim(),
          email: correo.trim().toLowerCase(),
          password,
          password_confirmation: confirmacion,
          privacy_consent: consentimiento,
          privacy_notice_version: PRIVACY_NOTICE_VERSION,
        },
      });

      setPassword('');
      setConfirmacion('');
      setMostrarPassword(false);
      setMostrarConfirmacion(false);

      Alert.alert('Cuenta creada', respuesta.message, [
        {
          text: 'Ir al login',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'No se pudo crear la cuenta',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.'
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
      <Stack.Screen
        options={{
          title: 'Registro',
          headerShown: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#FFF8F2' },
          headerTintColor: '#C2410C',
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 20 },
        ]}
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

          <Text style={styles.title}>Crea tu cuenta</Text>

          <Text style={styles.subtitle}>
            Unos datos y listo para comenzar.
          </Text>

          <Text style={styles.label}>Nombre</Text>

          <View style={styles.inputContainer}>
            <TextInput
              accessibilityLabel="Nombre"
              style={styles.input}
              placeholder="¿Cómo te llamas?"
              placeholderTextColor="#92959B"
              autoCapitalize="words"
              autoComplete="name"
              maxLength={100}
              editable={!enviando}
              value={nombre}
              onChangeText={setNombre}
            />
          </View>

          <Text style={styles.label}>Correo electrónico</Text>

          <View style={styles.inputContainer}>
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
            <TextInput
              accessibilityLabel="Contraseña"
              style={styles.input}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#92959B"
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={128}
              editable={!enviando}
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                mostrarPassword
                  ? 'Ocultar contraseña'
                  : 'Mostrar contraseña'
              }
              disabled={enviando}
              onPress={() => setMostrarPassword(!mostrarPassword)}
              style={styles.eyeButton}
            >
              <View style={styles.eye}>
                <View style={styles.pupil} />
              </View>

              {mostrarPassword && <View style={styles.eyeSlash} />}
            </Pressable>
          </View>

          <Text style={styles.label}>Confirmar contraseña</Text>

          <View style={styles.inputContainer}>
            <TextInput
              accessibilityLabel="Confirmar contraseña"
              style={styles.input}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#92959B"
              secureTextEntry={!mostrarConfirmacion}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={128}
              editable={!enviando}
              value={confirmacion}
              onChangeText={setConfirmacion}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                mostrarConfirmacion
                  ? 'Ocultar confirmación de contraseña'
                  : 'Mostrar confirmación de contraseña'
              }
              disabled={enviando}
              onPress={() => setMostrarConfirmacion(!mostrarConfirmacion)}
              style={styles.eyeButton}
            >
              <View style={styles.eye}>
                <View style={styles.pupil} />
              </View>

              {mostrarConfirmacion && <View style={styles.eyeSlash} />}
            </Pressable>
          </View>

          <View style={styles.privacyCard}>
            <Text style={styles.privacyTitle}>Tus datos personales</Text>

            <Text style={styles.privacyDescription}>
              Consulta cómo se utilizarán tus datos antes de crear tu cuenta.
            </Text>

            <Link href="/aviso" style={styles.privacyLink}>
              Leer aviso de privacidad →
            </Link>

            <View style={styles.divider} />

            <View style={styles.consentRow}>
              <Text style={styles.consentText}>
                He leído el aviso de privacidad y consiento el tratamiento
                de mis datos personales para crear y administrar mi cuenta.
              </Text>

              <Switch
                accessibilityLabel="Consentimiento para el uso de datos personales"
                value={consentimiento}
                onValueChange={setConsentimiento}
                disabled={enviando}
                trackColor={{ false: '#D1D5DB', true: '#FDBA74' }}
                thumbColor={consentimiento ? '#C2410C' : '#F3F4F6'}
              />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: enviando,
              busy: enviando,
            }}
            disabled={enviando}
            onPress={registrar}
            style={({ pressed }) => [
              styles.button,
              (pressed || enviando) && styles.buttonPressed,
            ]}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Crear cuenta</Text>
            )}
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>¿Ya tienes cuenta?</Text>

            <Pressable
              accessibilityRole="button"
              disabled={enviando}
              onPress={() => router.replace('/')}
              style={styles.loginLinkButton}
            >
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </Pressable>
          </View>
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
    paddingTop: 12,
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
    marginTop: 8,
    marginBottom: 32,
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
  title: {
    color: '#191919',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    color: '#686868',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
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
    marginBottom: 18,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: '#252525',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 17,
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
  privacyCard: {
    backgroundColor: '#FFF0E3',
    borderWidth: 1,
    borderColor: '#F4D7BD',
    borderRadius: 18,
    padding: 18,
    marginTop: 6,
    marginBottom: 22,
  },
  privacyTitle: {
    color: '#9A3412',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  privacyDescription: {
    color: '#705B4C',
    fontSize: 14,
    lineHeight: 21,
  },
  privacyLink: {
    color: '#C2410C',
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F4D7BD',
    marginBottom: 14,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consentText: {
    flex: 1,
    color: '#5B4638',
    fontSize: 13,
    lineHeight: 20,
  },
  button: {
    minHeight: 58,
    backgroundColor: '#C2410C',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 8,
    marginTop: 18,
  },
  loginText: {
    color: '#686868',
    fontSize: 15,
  },
  loginLinkButton: {
    paddingVertical: 12,
  },
  loginLink: {
    color: '#C2410C',
    fontSize: 15,
    fontWeight: '700',
  },
});