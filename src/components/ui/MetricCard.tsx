import { MaterialIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
  /** Nombre de ícono Material (Maps de @expo/vector-icons). */
  icono: string;
  /** Color del ícono: usar tokens de '@/theme/tokens'. */
  colorIcono: string;
  /** Clase de fondo del contenedor del ícono, p. ej. 'bg-secondary-container'. */
  fondoIcono: string;
  /** Línea pequeña descriptiva del sensor, p. ej. "Humedad Sustrato · Sonda A0". */
  etiqueta: string;
  /** Contenido grande: número + unidad. */
  valor: ReactNode;
  /** Texto corto junto al valor (p. ej. "Óptimo (45-65%)") con su clase de color. */
  detalle?: { texto: string; clase: string };
  /** Badge o anillo en la esquina superior derecha (opcional). */
  derecha?: ReactNode;
  /** Fila de control debajo de la métrica (ActuadorRow / FilaAccion). */
  fila?: ReactNode;
}

/** Tarjeta de telemetría: ícono + etiqueta + valor grande + (badge) + fila de actuador. */
export function MetricCard({ icono, colorIcono, fondoIcono, etiqueta, valor, detalle, derecha, fila }: Props) {
  return (
    <View className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm shadow-black/5">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-2">
          <View className={`h-10 w-10 items-center justify-center rounded-xl ${fondoIcono}`}>
            <MaterialIcons name={icono as never} size={22} color={colorIcono} />
          </View>
          <View className="flex-col">
            <Text className="text-label-sm text-on-surface-variant">{etiqueta}</Text>
            <View className="flex-row items-baseline gap-1.5">
              <Text className="text-headline-sm font-bold text-on-surface">{valor}</Text>
              {detalle && (
                <Text className={`text-label-sm font-medium ${detalle.clase}`}>{detalle.texto}</Text>
              )}
            </View>
          </View>
        </View>
        {derecha}
      </View>
      {fila && <View className="pt-2">{fila}</View>}
    </View>
  );
}

/** Badge pill pequeño usado en la esquina de las tarjetas de métrica. */
export function BadgeMetrica({ texto, fondo, color }: { texto: string; fondo: string; color: string }) {
  return (
    <View className={`rounded-full px-2.5 py-1 ${fondo}`}>
      <Text className={`text-label-sm font-semibold ${color}`}>{texto}</Text>
    </View>
  );
}
