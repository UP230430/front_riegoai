import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Switch, Text, View } from 'react-native';
import { hapticoToque } from '@/utils/haptico';

interface Props {
  icono: string;
  colorIcono: string;
  titulo: string;
  subtitulo: string;
  activo: boolean;
  /** Roles autorizados; si el actual no puede, se muestra candado. */
  permitido: boolean;
  /** Mensaje para explicar el bloqueo (rol u offline). */
  motivoBloqueo?: string;
  onChange: (valor: boolean) => void;
}

/** Fila de la matriz GPIO: icono + título + switch, con candado si no aplica. */
export function ActuadorRow({
  icono,
  colorIcono,
  titulo,
  subtitulo,
  activo,
  permitido,
  motivoBloqueo,
  onChange,
}: Props) {
  if (!permitido) {
    return (
      <View
        className="flex-row items-center justify-between rounded-xl bg-surface-container-low p-2.5 opacity-70"
        accessibilityLabel={`${titulo}. Bloqueado: ${motivoBloqueo ?? 'requiere permisos'}`}
      >
        <View className="flex-row items-center gap-2">
          <MaterialCommunityIcons name={icono as never} size={20} color="#555555" />
          <View className="flex-col">
            <Text className="text-[12px] leading-[16px] font-medium text-on-surface">{titulo}</Text>
            <Text className="text-[11px] text-on-surface-variant">
              🔒 {motivoBloqueo ?? 'Solo admin'}
            </Text>
          </View>
        </View>
        <Switch disabled trackColor={{ false: '#D7DFD1', true: '#2E7D32' }} value={false} />
      </View>
    );
  }
  return (
    <View className="flex-row items-center justify-between rounded-xl bg-surface-container-low p-2.5">
      <View className="flex-row items-center gap-2">
        <MaterialCommunityIcons name={icono as never} size={20} color={colorIcono} />
        <View className="flex-col">
          <Text className="text-[12px] leading-[16px] font-medium text-on-surface">{titulo}</Text>
          <Text className="text-[11px] leading-[14px] text-on-surface-variant">{subtitulo}</Text>
        </View>
      </View>
      <Switch
        value={activo}
        onValueChange={(v) => {
          hapticoToque();
          onChange(v);
        }}
        trackColor={{ false: '#D7DFD1', true: '#2E7D32' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D7DFD1"
        accessibilityLabel={titulo}
        style={{ transform: [{ scale: 1.1 }] }}
      />
    </View>
  );
}

/** Fila clickable con icono (para acciones tipo tarjeta). */
export function FilaAccion({
  icono,
  colorIcono,
  titulo,
  subtitulo,
  onPress,
  deshabilitado,
  motivoBloqueo,
  derecha,
}: {
  icono: string;
  colorIcono: string;
  titulo: string;
  subtitulo: string;
  onPress?: () => void;
  deshabilitado?: boolean;
  motivoBloqueo?: string;
  derecha?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      className={`flex-row items-center justify-between gap-2 rounded-xl bg-surface-container-low p-space-sm ${deshabilitado ? 'opacity-60' : 'active:opacity-80'}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(deshabilitado) }}
      accessibilityLabel={deshabilitado ? `${titulo}. ${motivoBloqueo ?? ''}` : titulo}
    >
      <View className="flex-row items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
        <MaterialCommunityIcons name={icono as never} size={18} color={colorIcono} />
        <View className="flex-col" style={{ minWidth: 0, flex: 1 }}>
          <Text className="truncate text-[12px] leading-[16px] font-semibold text-on-surface" numberOfLines={1}>
            {titulo}
          </Text>
          <Text className="text-[11px] leading-[14px] text-on-surface-variant" numberOfLines={1}>
            {deshabilitado ? `${motivoBloqueo ?? 'Deshabilitado'}` : subtitulo}
          </Text>
        </View>
      </View>
      <View className="shrink-0">{derecha}</View>
    </Pressable>
  );
}
