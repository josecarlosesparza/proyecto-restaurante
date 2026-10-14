import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AnimatedSplashOverlay />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFF8F2' },
          headerTintColor: '#C2410C',
          contentStyle: { backgroundColor: '#FFF8F2' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Acceso' }}
        />
      </Stack>
    </ThemeProvider>
  );
}