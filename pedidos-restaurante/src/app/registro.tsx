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
  const [consentimiento, setConsentimiento] = useState(false);
  const [enviando, setEnviando] = useState(false);

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
      <Stack.Screen options={{ title: 'Registro' }} />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Crear cuenta</Text>

        <Text style={styles.description}>
          Completa tus datos para registrarte.
        </Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          placeholderTextColor="#777"
          autoCapitalize="words"
          autoComplete="name"
          maxLength={100}
          editable={!enviando}
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="ejemplo@correo.com"
          placeholderTextColor="#777"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          maxLength={255}
          editable={!enviando}
          value={correo}
          onChangeText={setCorreo}
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor="#777"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={128}
          editable={!enviando}
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Repite tu contraseña"
          placeholderTextColor="#777"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={128}
          editable={!enviando}
          value={confirmacion}
          onChangeText={setConfirmacion}
        />

        <Text style={styles.label}>Uso de datos personales</Text>

        <Text style={styles.notice}>
          Antes de crear tu cuenta, consulta el aviso de privacidad.
        </Text>

        <Link href="/aviso" style={styles.link}>
          Leer aviso de privacidad
        </Link>

        <View style={styles.consentRow}>
          <Switch
            accessibilityLabel="Consentimiento para el uso de datos personales"
            value={consentimiento}
            onValueChange={setConsentimiento}
            disabled={enviando}
            trackColor={{ false: '#D1D5DB', true: '#FDBA74' }}
            thumbColor={consentimiento ? '#C2410C' : '#F3F4F6'}
          />

          <Text style={styles.consentText}>
            He leído el aviso de privacidad y consiento el tratamiento
            de mis datos personales para crear y administrar mi cuenta.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: enviando, busy: enviando }}
          disabled={enviando}
          style={({ pressed }) => [
            styles.button,
            (pressed || enviando) && { opacity: 0.7 },
          ]}
          onPress={registrar}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </Pressable>
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
    paddingVertical: 32,
  },
  title: {
    color: '#1F2937',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 28,
  },
  label: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  notice: {
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 12,
  },
  link: {
    color: '#C2410C',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    marginBottom: 12,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  consentText: {
    flex: 1,
    color: '#1F2937',
    lineHeight: 22,
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#C2410C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});