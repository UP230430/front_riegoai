import { useSesion } from '@/store/useSesionStore';
import { Redirect } from 'expo-router';
import { useEffect } from 'react';

/** Puerta de sesión: manda a Login o a las pestañas según haya sesión. */
export default function PuertaSesion() {
  const { usuario, inicializando, inicializar } = useSesion();

  useEffect(() => {
    void inicializar();
  }, [inicializar]);

  if (inicializando) return null;
  if (!usuario) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)/inicio" />;
}
