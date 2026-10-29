import { Stack, router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const secciones = [
  {
    titulo: '01 · Responsable de tus datos',
    texto:
      'Operadora Tokis Burger, S.A. de C.V., con domicilio en Calle del Sabor 125, colonia Centro, Aguascalientes, México, es responsable del tratamiento de los datos personales recabados mediante esta aplicación.',
  },
  {
    titulo: '02 · Información que recopilamos',
    texto:
      'Para registrar tu cuenta solicitamos nombre, correo electrónico y contraseña. También guardamos la fecha de tu consentimiento y la versión del aviso aceptado. Este formulario no solicita datos sensibles, bancarios ni ubicación.',
  },
  {
    titulo: '03 · Para qué utilizamos tus datos',
    texto:
      'Utilizamos esta información para crear y administrar tu cuenta, comprobar tus credenciales al iniciar sesión y conservar constancia de tu consentimiento. No utilizamos los datos de registro para enviar publicidad.',
  },
  {
    titulo: '04 · Acceso y protección',
    texto:
      'La contraseña se almacena mediante un hash y no se incluye en las respuestas de la API. El acceso autenticado utiliza un token de sesión. Estas medidas no eliminan todos los riesgos asociados al uso de sistemas digitales.',
  },
  {
    titulo: '05 · Comunicación a terceros',
    texto:
      'El flujo actual de registro e inicio de sesión no contempla transferencias de tus datos a terceros. Si se incorporan nuevos destinatarios o finalidades, se actualizará la información correspondiente.',
  },
  {
    titulo: '06 · Control sobre tu información',
    texto:
      'Puedes solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos, así como limitar su uso o revocar tu consentimiento. El contacto previsto es privacidad@tokisburger.com. La solicitud debe indicar tu nombre, el correo de tu cuenta y lo que deseas solicitar. La atención requiere verificar tu identidad.',
  },
  {
    titulo: '07 · Actualizaciones',
    texto:
      'Los cambios se publicarán en esta pantalla con una nueva fecha y versión. Si cambian las finalidades del tratamiento, se solicitará el consentimiento que corresponda.',
  },
  {
    titulo: '08 · Tu decisión',
    texto:
      'Abrir o leer este aviso no activa el consentimiento. Puedes otorgarlo mediante el interruptor del registro. Sin esa aceptación, la aplicación no creará la cuenta.',
  },
];

export default function AvisoScreen() {

  const insets = useSafeAreaInsets();
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20 },
      ]}
    >
      <Stack.Screen
        options={{
          title: 'Privacidad',
          headerShown: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#FFF8F2' },
          headerTintColor: '#C2410C',
        }}
      />

      <View style={styles.page}>
        <Text style={styles.brand}>TOKIS BURGER</Text>

          <Text style={styles.noticeTitle}>Aviso de privacidad</Text>

          <Text style={styles.title}>Tu privacidad{'\n'}importa.</Text>

          <Text style={styles.description}>
            Conoce qué información compartes y cómo se utiliza
            al crear tu cuenta.
          </Text>

          <View style={styles.summary}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Versión 1.0</Text>
            </View>

            <Text style={styles.date}>
              Actualizado el 15 de octubre de 2026
            </Text>
          </View>

        {secciones.map((seccion) => (
          <View key={seccion.titulo} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {seccion.titulo}
            </Text>

            <Text style={styles.paragraph}>
              {seccion.texto}
            </Text>
          </View>
        ))}

        <View style={styles.contact}>
          <Text style={styles.contactTitle}>
            Contacto de privacidad
          </Text>
          <Text selectable style={styles.contactEmail}>
            privacidad@tokisburger.com
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.buttonText}>Volver al registro</Text>
        </Pressable>

        <Text style={styles.footer}>
          La aceptación se realiza desde el formulario de registro.
        </Text>
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
    paddingTop: 20,
    paddingBottom: 40,
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
    marginBottom: 18,
  },
  title: {
    color: '#191919',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 44,
    marginBottom: 14,
  },
  description: {
    color: '#686868',
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 24,
  },
  summary: {
    backgroundColor: '#FFF0E3',
    borderWidth: 1,
    borderColor: '#F4D7BD',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  summaryTitle: {
    color: '#9A3412',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryText: {
    color: '#705B4C',
    fontSize: 15,
    marginBottom: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    color: '#C2410C',
    fontSize: 12,
    fontWeight: '700',
  },
  date: {
    color: '#705B4C',
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#252525',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  paragraph: {
    color: '#5F5F5F',
    fontSize: 15,
    lineHeight: 25,
  },
  contact: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DEDEDE',
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  contactTitle: {
    color: '#252525',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  contactEmail: {
    color: '#C2410C',
    fontSize: 14,
    lineHeight: 22,
  },
  button: {
    minHeight: 58,
    backgroundColor: '#C2410C',
    borderRadius: 16,
    padding: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: '#686868',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 16,
  },
});