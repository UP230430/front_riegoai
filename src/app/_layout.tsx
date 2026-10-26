import { simulador } from '@/mocks/simulador';
import { useSesion } from '@/store/useSesionStore';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import '../global.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5_000 },
  },
});

/** Carga fichero, sesión y arranca el simulador en vivo de la demo. */
function Puerta() {
  const [fontCargada] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { inicializando, inicializar } = useSesion();

  useEffect(() => {
    void inicializar();
    simulador.iniciar();
  }, [inicializar]);

  useEffect(() => {
    // Ocultar el splash en cuanto haya fuente y sesión resuelta, haya
    // usuario o no (sin sesión se va a /login y el splash no debe colgarse).
    if (fontCargada && !inicializando) {
      void SplashScreen.hideAsync();
    }
  }, [fontCargada, inicializando]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="planta/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="vivero-mapa" options={{ presentation: 'modal' }} />
      <Stack.Screen name="admin/usuarios" />
      <Stack.Screen name="perfil" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function Raiz() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Puerta />
    </QueryClientProvider>
  );
}
