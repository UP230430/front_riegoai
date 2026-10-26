import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { StatusPill } from './StatusPill';

interface Props {
  tituloPantalla: string;
  online: boolean;
  inicialesUsuario: string;
}

/** Header fijo estilo Stitch: logo + título + estado RPi + avatar (→ Perfil). */
export function Header({ tituloPantalla, online, inicialesUsuario }: Props) {
  return (
    <View className="h-16 flex-row items-center justify-between px-gutter-mobile">
      <View className="flex-row items-center gap-space-xs">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-container">
          <MaterialIcons name="eco" size={22} color="#2E7D32" />
        </View>
        <View className="flex flex-col">
          <Text className="text-title-sm text-on-surface" style={{ fontWeight: '600' }}>
            RiegoSmart IA
          </Text>
          <Text className="text-label-sm text-on-surface-variant" style={{ fontWeight: '500' }}>
            {tituloPantalla}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center gap-space-sm">
        <StatusPill online={online} />
        <Link href="/perfil" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir perfil"
            className="h-9 w-9 min-w-[36px] items-center justify-center rounded-full bg-primary"
          >
            <Text className="text-[13px] font-semibold text-on-primary">
              {inicialesUsuario.slice(0, 2).toUpperCase()}
            </Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
