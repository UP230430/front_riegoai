import '../global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useSesion } from '@/store/useSesionStore';
import { simulador } from '@/mocks/simulador';

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

  const { usuario, inicializando, inicializar } = useSesion();

  useEffect(() => {
    void inicializar();
    simulador.iniciar();
  }, [inicializar]);

  useEffect(() => {
    if (fontCargada && usuario !== null && !inicializando) {
      void SplashScreen.hideAsync();
    }
  }, [fontCargada, usuario, inicializando]);

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
