import { Link } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';

import { apiRequest } from '@/services/api';

type Usuario = {
  id: number;
  name: string;
  email: string;
};

type LoginResponse = {
  message: string;
  token: string;
  token_type: string;
  user: Usuario;
};

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  async function iniciarSesion() {
    if (enviando) return;

    if (!correo.trim() || !password) {
      Alert.alert('Campos incompletos', 'Escribe tu correo y contraseña.');
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

      await SecureStore.setItemAsync('auth_token', respuesta.token);

      setPassword('');
      setUsuario(respuesta.user);
    } catch (error) {
      Alert.alert(
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
      const token = await SecureStore.getItemAsync('auth_token');

      if (token) {
        await apiRequest<{ message: string }>('/logout', {
          method: 'POST',
          token,
        });
      }

      await SecureStore.deleteItemAsync('auth_token');
      setUsuario(null);
      setCorreo('');
      setPassword('');
    } catch (error) {
      Alert.alert(
        'No se pudo cerrar sesión',
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.'
      );
    } finally {
      setEnviando(false);
    }
  }

  if (usuario) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.brand}>Pedidos Restaurante</Text>
        <Text style={styles.title}>¡Bienvenido, {usuario.name}!</Text>

        <Text style={styles.description}>
          Has iniciado sesión correctamente.
        </Text>

        <Text style={styles.label}>Tu correo</Text>
        <Text style={styles.description}>{usuario.email}</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: enviando, busy: enviando }}
          disabled={enviando}
          style={({ pressed }) => [
            styles.button,
            (pressed || enviando) && { opacity: 0.7 },
          ]}
          onPress={cerrarSesion}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Cerrar sesión</Text>
          )}
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.brand}>Pedidos Restaurante</Text>
        <Text style={styles.title}>Iniciar sesión</Text>

        <Text style={styles.description}>
          Ingresa con tu cuenta para continuar.
        </Text>

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
          placeholder="Escribe tu contraseña"
          placeholderTextColor="#777"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={128}
          editable={!enviando}
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: enviando, busy: enviando }}
          disabled={enviando}
          style={({ pressed }) => [
            styles.button,
            (pressed || enviando) && { opacity: 0.7 },
          ]}
          onPress={iniciarSesion}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </Pressable>

        <Link href="/registro" style={styles.link}>
          ¿No tienes cuenta? Regístrate
        </Link>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brand: {
    color: '#C2410C',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 24,
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
    marginBottom: 32,
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
  link: {
    color: '#C2410C',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 16,
    paddingVertical: 8,
  },
});