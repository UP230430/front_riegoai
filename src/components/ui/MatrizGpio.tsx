import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Card } from './Card';
import { ActuadorRow } from './ActuadorRow';
import type { EstadoDispositivo } from '@/types';
import { colores } from '@/theme/tokens';

/** Actuadores con su relé GPIO (la válvula y el modo auto también viven aquí). */
type SalidaGpio = 'bomba' | 'ventilador' | 'leds' | 'valvula';

interface Props {
  online: boolean;
  esAdmin: boolean;
  /** Estado del dispositivo; undefined ⇒ valores por defecto. */
  dispositivo?: EstadoDispositivo;
  /** Acciona una salida GPIO (el padre decide cómo persistirlo). */
  onActuar: (tipo: SalidaGpio, valor: boolean) => void;
  onAlternarAuto: () => void;
  onEmergencia: () => void;
}

/** Card "Matriz RPi GPIO": relés, modo Auto IA y parada de emergencia (admin). */
export function MatrizGpio({ online, esAdmin, dispositivo, onActuar, onAlternarAuto, onEmergencia }: Props) {
  const modoAuto = dispositivo?.modoAuto ?? true;
  const permitidoRelé = esAdmin && online;
  const motivoRelé = esAdmin ? 'RPi Offline' : 'Solo admin desde la matriz';

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-surface-container-highest">
            <MaterialIcons name="developer-board" size={18} color={colores.onSurface} />
          </View>
          <View className="flex-col">
            <Text className="text-title-sm text-on-surface">Matriz RPi GPIO</Text>
            <Text className="text-label-sm text-on-surface-variant">Raspberry Pi 4B · 4 pines asignados</Text>
          </View>
        </View>
        {esAdmin && online ? (
          <Pressable
            onPress={onAlternarAuto}
            className={`rounded-full px-2.5 py-1 ${modoAuto ? 'bg-primary-container' : 'bg-tertiary-container'}`}
            accessibilityLabel="Alternar modo automático"
          >
            <Text className="text-label-sm font-semibold text-on-primary-container">
              {modoAuto ? 'Modo Auto IA' : 'Modo Manual'}
            </Text>
          </Pressable>
        ) : (
          <View className="rounded-full bg-surface-container px-2.5 py-1" accessibilityLabel="Modo automático: solo admin">
            <Text className="text-label-sm font-semibold text-on-surface">🔒 Modo Auto IA</Text>
          </View>
        )}
      </View>

      <View className="gap-1 pt-2">
        <ActuadorRow
          icono="water-pump"
          colorIcono={colores.secondary}
          titulo="Relé Bomba de Riego"
          subtitulo="BCM GPIO 17 (Pin 11)"
          activo={dispositivo?.bomba ?? false}
          permitido={permitidoRelé}
          motivoBloqueo={esAdmin ? 'RPi Offline' : 'Solo admin: usa la tarjeta de humedad para regar'}
          onChange={(v) => onActuar('bomba', v)}
        />
        <ActuadorRow
          icono="air-filter"
          colorIcono={colores.tertiary}
          titulo="Ventilación Extractor"
          subtitulo="BCM GPIO 27 (Pin 13)"
          activo={dispositivo?.ventilador ?? false}
          permitido={permitidoRelé}
          motivoBloqueo={motivoRelé}
          onChange={(v) => onActuar('ventilador', v)}
        />
        <ActuadorRow
          icono="lightbulb"
          colorIcono={colores.primary}
          titulo="Panel Fotónico LED"
          subtitulo="BCM GPIO 22 (Pin 15)"
          activo={dispositivo?.leds ?? false}
          permitido={permitidoRelé}
          motivoBloqueo={motivoRelé}
          onChange={(v) => onActuar('leds', v)}
        />
        <ActuadorRow
          icono="valve"
          colorIcono={colores.onSurfaceVariant}
          titulo="Válvula de Llenado Red"
          subtitulo="BCM GPIO 24 (Pin 18)"
          activo={dispositivo?.valvulaLlenado ?? false}
          permitido={permitidoRelé}
          motivoBloqueo={motivoRelé}
          onChange={(v) => onActuar('valvula', v)}
        />
      </View>

      {esAdmin ? (
        <Pressable
          onPress={onEmergencia}
          className="mt-2 min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl bg-error-container py-3 active:scale-[0.98]"
          accessibilityRole="button"
          accessibilityLabel="Parada de emergencia general"
        >
          <MaterialIcons name="power-settings-new" size={18} color={colores.onErrorContainer} />
          <Text className="text-label-md font-semibold text-on-error-container">
            Parada de Emergencia General
          </Text>
        </Pressable>
      ) : (
        <View
          className="mt-2 min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl bg-surface-container py-3"
          accessibilityLabel="Parada de emergencia: solo administrador"
        >
          <MaterialCommunityIcons name="lock" size={16} color={colores.onSurfaceVariant} />
          <Text className="text-label-md text-on-surface-variant">
            Parada de emergencia · Solo admin
          </Text>
        </View>
      )}
    </Card>
  );
}
