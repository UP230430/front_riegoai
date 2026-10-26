import { Tabs, Redirect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colores } from '@/theme/tokens';
import { useSesion } from '@/store/useSesionStore';
import type { ComponentProps } from 'react';

type NombreIcono = ComponentProps<typeof MaterialIcons>['name'];

function Icono({ nombre, color }: { nombre: NombreIcono; color: string }) {
  return <MaterialIcons name={nombre} size={24} color={color} />;
}

/** Barra inferior de 4 pestañas con áreas táctiles ≥ 44 px y protección de sesión. */
export default function LayoutPestanas() {
  const { usuario, inicializando } = useSesion();
  if (!inicializando && !usuario) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.primary,
        tabBarInactiveTintColor: '#555555',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', fontFamily: undefined },
        tabBarStyle: { height: 64, paddingBottom: 8, paddingTop: 6 },
        sceneStyle: { backgroundColor: colores.surface },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Icono nombre="home" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color }) => <Icono nombre="timeline" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="camara"
        options={{
          title: 'Cámara',
          tabBarIcon: ({ color }) => <Icono nombre="photo-camera" color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="reglas"
        options={{
          title: 'Reglas',
          tabBarIcon: ({ color }) => <Icono nombre="smart-toy" color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
