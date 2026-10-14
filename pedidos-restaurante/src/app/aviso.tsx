import { Stack, router } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
} from 'react-native';

export default function AvisoScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Stack.Screen options={{ title: 'Aviso de privacidad' }} />

      <Text style={styles.title}>Aviso de privacidad</Text>
      <Text style={styles.version}>Versión 1.0 · 13 de octubre de 2026</Text>

      <Text style={styles.draft}>
        Borrador académico. Utiliza datos ficticios en las pruebas.
        Los datos del responsable deben completarse antes de usar
        esta aplicación con clientes reales.
      </Text>

      <Text style={styles.heading}>1. Responsable</Text>
      <Text style={styles.paragraph}>
        Nombre o razón social: [PENDIENTE].{'\n'}
        Domicilio: [PENDIENTE], Aguascalientes, México.{'\n'}
        Contacto de privacidad: [PENDIENTE].
      </Text>

      <Text style={styles.heading}>2. Datos recopilados</Text>
      <Text style={styles.paragraph}>
        El registro solicita nombre, correo electrónico y contraseña.
        También se registrará la aceptación de este aviso, su versión
        y la fecha del consentimiento.
      </Text>

      <Text style={styles.heading}>3. Finalidades</Text>
      <Text style={styles.paragraph}>
        Crear y administrar tu cuenta, verificar tu identidad al iniciar
        sesión y registrar tu consentimiento. Este registro no solicita
        dirección de entrega ni datos de pago.
      </Text>

      <Text style={styles.heading}>4. Publicidad y transferencias</Text>
      <Text style={styles.paragraph}>
        Este prototipo no contempla utilizar tus datos para publicidad
        ni transferirlos a terceros.
      </Text>

      <Text style={styles.heading}>5. Tus derechos</Text>
      <Text style={styles.paragraph}>
        Puedes solicitar acceso, rectificación, cancelación u oposición
        al tratamiento de tus datos, así como revocar tu consentimiento
        o limitar su uso, mediante el contacto de privacidad indicado.
        El canal y procedimiento de atención están pendientes de
        completar en este borrador.
      </Text>

      <Text style={styles.heading}>6. Cambios al aviso</Text>
      <Text style={styles.paragraph}>
        Las actualizaciones se publicarán en esta pantalla con su
        versión y fecha.
      </Text>

      <Text style={styles.heading}>7. Consentimiento</Text>
      <Text style={styles.paragraph}>
        Leer este aviso no activa el consentimiento. Para otorgarlo,
        regresa al registro y activa voluntariamente el interruptor.
        Si no lo aceptas, este prototipo no permitirá crear la cuenta.
      </Text>

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.8 },
        ]}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Volver al registro</Text>
      </Pressable>
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
    paddingVertical: 28,
  },
  title: {
    color: '#1F2937',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  version: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 20,
  },
  draft: {
    backgroundColor: '#FFEDD5',
    color: '#9A3412',
    padding: 16,
    borderRadius: 12,
    lineHeight: 22,
    marginBottom: 24,
  },
  heading: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  paragraph: {
    color: '#4B5563',
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#C2410C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});