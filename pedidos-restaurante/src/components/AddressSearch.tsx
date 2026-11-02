import * as Crypto from 'expo-crypto';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { apiRequest } from '@/services/api';
import { obtenerToken } from '@/services/session';

type Sugerencia = {
  place_id: string;
  description: string;
};

type Direccion = {
  place_id: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  onSelect: (direccion: string) => void;
  disabled?: boolean;
};

export default function AddressSearch({
  onSelect,
  disabled = false,
}: Props) {
  const sessionToken = useRef<string | null>(null);
  const ocupadoRef = useRef(false);

  const [consulta, setConsulta] = useState('');
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function buscar() {
    if (ocupadoRef.current || disabled) return;

    setError('');
    setMensaje('');
    setSugerencias([]);

    if (consulta.trim().length < 3) {
      setError('Escribe al menos tres caracteres para buscar.');
      return;
    }

    ocupadoRef.current = true;
    setCargando(true);

    try {
      const token = await obtenerToken();

      if (!token) {
        throw new Error('Inicia sesión para buscar tu dirección.');
      }

      if (!sessionToken.current) {
        sessionToken.current = Crypto.randomUUID();
      }

      const respuesta = await apiRequest<{
        suggestions: Sugerencia[];
      }>('/addresses/autocomplete', {
        method: 'POST',
        token,
        body: {
          input: consulta.trim(),
          session_token: sessionToken.current,
        },
      });

      setSugerencias(respuesta.suggestions);

      if (respuesta.suggestions.length === 0) {
        setMensaje(
          'No encontramos sugerencias. Prueba con la calle y la ciudad.'
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudieron buscar direcciones.'
      );
    } finally {
      ocupadoRef.current = false;
      setCargando(false);
    }
  }

  async function seleccionar(sugerencia: Sugerencia) {
    if (
      ocupadoRef.current ||
      disabled ||
      !sessionToken.current
    ) {
      return;
    }

    ocupadoRef.current = true;
    setCargando(true);
    setError('');
    setMensaje('');

    try {
      const token = await obtenerToken();

      if (!token) {
        throw new Error('Inicia sesión para seleccionar la dirección.');
      }

      const respuesta = await apiRequest<{ address: Direccion }>(
        '/addresses/details',
        {
          method: 'POST',
          token,
          body: {
            place_id: sugerencia.place_id,
            session_token: sessionToken.current,
          },
        }
      );

      onSelect(respuesta.address.address);
      setConsulta('');
      setMensaje(
        'Dirección copiada al formulario. Revisa y completa el número de casa.'
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo seleccionar la dirección.'
      );
    } finally {
      // Una consulta de detalles termina la sesión de búsqueda.
      sessionToken.current = null;
      setSugerencias([]);
      ocupadoRef.current = false;
      setCargando(false);
    }
  }

  const bloqueado = disabled || cargando;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Busca tu dirección</Text>

      <Text style={styles.description}>
        Escribe la calle y ciudad, busca y selecciona una sugerencia.
      </Text>

      <TextInput
        accessibilityLabel="Buscar dirección de entrega"
        style={styles.input}
        placeholder="Ejemplo: Madero, Aguascalientes"
        placeholderTextColor="#858585"
        maxLength={200}
        editable={!bloqueado}
        value={consulta}
        onChangeText={(texto) => {
          setConsulta(texto);
          setSugerencias([]);
          setError('');
          setMensaje('');
        }}
        returnKeyType="search"
        onSubmitEditing={buscar}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: bloqueado,
          busy: cargando,
        }}
        disabled={bloqueado}
        onPress={buscar}
        style={[
          styles.button,
          bloqueado && { opacity: 0.5 },
        ]}
      >
        {cargando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Buscar dirección</Text>
        )}
      </Pressable>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      {mensaje ? (
        <Text style={styles.description} accessibilityLiveRegion="polite">
          {mensaje}
        </Text>
      ) : null}

      {sugerencias.length > 0 && (
        <View style={styles.results}>
          {sugerencias.map((sugerencia) => (
            <Pressable
              key={sugerencia.place_id}
              accessibilityRole="button"
              disabled={bloqueado}
              onPress={() => seleccionar(sugerencia)}
              style={styles.result}
            >
              <Text style={styles.resultText}>
                {sugerencia.description}
              </Text>
            </Pressable>
          ))}

          <Text
            accessibilityLabel="Google Maps"
            numberOfLines={1}
            style={styles.attribution}
          >
            Google Maps
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF0E3',
    borderWidth: 1,
    borderColor: '#F4D7BD',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  title: {
    color: '#9A3412',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#705B4C',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#252525',
    borderWidth: 1,
    borderColor: '#DEDEDE',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#C2410C',
    minHeight: 48,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  results: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  result: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  resultText: {
    color: '#252525',
    fontSize: 14,
    lineHeight: 22,
  },
  attribution: {
    color: '#5E5E5E',
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'right',
    padding: 12,
  },
  error: {
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 22,
    marginVertical: 10,
  },
});