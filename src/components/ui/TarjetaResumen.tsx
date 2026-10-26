import { MaterialIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Card } from './Card';

interface Props {
  icono: string;
  colorIcono: string;
  fondoIcono: string;
  /** Esquina derecha del encabezado: { texto, clase de color/weight } */
  etiquetaDerecha: { texto: string; clase: string };
  children: ReactNode;
}

/** Encabezado compartido de las tarjetas de la fila resumen (2 columnas del Inicio). */
export function TarjetaResumen({ icono, colorIcono, fondoIcono, etiquetaDerecha, children }: Props) {
  return (
    <Card className="flex-1 justify-between gap-2">
      <View className="flex-row items-center justify-between">
        <View className={`h-8 w-8 items-center justify-center rounded-lg ${fondoIcono}`}>
          <MaterialIcons name={icono as never} size={18} color={colorIcono} />
        </View>
        <Text className={`text-label-sm ${etiquetaDerecha.clase}`}>{etiquetaDerecha.texto}</Text>
      </View>
      {children}
    </Card>
  );
}
