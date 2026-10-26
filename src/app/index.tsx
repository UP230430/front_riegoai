import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useSesion } from '@/store/useSesionStore';

/** Puerta de sesión: manda a Login o a las pestañas según haya sesión. */
export default function PuertaSesion() {
  const { usuario, inicializando, inicializar } = useSesion();
  const yaIniciando = inicializar;

  useEffect(() => {
    void yaIniciando();
  }, [yaIniciando]);

  if (inicializando) return null;
  if (!usuario) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)" />;
}
