import { View, type ViewProps } from 'react-native';

interface Props extends ViewProps {
  /** Elevación estilo Stitch (shadow-sm). */
  elevada?: boolean;
  /** Contenedor-plano (surface-container-low) o blanco (lowest). */
  tono?: 'blanco' | 'bajo';
}

/** Tarjeta base: radio 16px, p-16px, superficie blanca. */
export function Card({ elevada = false, tono = 'blanco', className = '', children, ...resto }: Props) {
  const fondo = tono === 'blanco' ? 'bg-surface-container-lowest' : 'bg-surface-container-low';
  return (
    <View
      className={`rounded-2xl p-space-md ${fondo} ${elevada ? 'shadow-md shadow-black/10' : 'shadow-sm shadow-black/5'} ${className}`}
      {...resto}
    >
      {children}
    </View>
  );
}
