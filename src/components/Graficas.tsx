import Svg, { Circle, Defs, LinearGradient, Path, Polyline, Stop } from 'react-native-svg';
import { Text, View } from 'react-native';

/** Anillo SVG de progreso (humedad del Inicio). */
export function AnilloProgreso({
  pct,
  tamano = 40,
  trazo = 3.5,
  color = '#1E88E5',
  colorFondo = '#D7DFD1',
}: {
  pct: number;
  tamano?: number;
  trazo?: number;
  color?: string;
  colorFondo?: string;
}) {
  const r = (tamano - trazo) / 2;
  const c = 2 * Math.PI * r;
  const arco = (Math.min(100, Math.max(0, pct)) / 100) * c;
  const centro = tamano / 2;
  return (
    <View style={{ width: tamano, height: tamano }} className="relative items-center justify-center">
      <Svg width={tamano} height={tamano} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={centro} cy={centro} r={r} stroke={colorFondo} strokeWidth={trazo} fill="none" />
        <Circle
          cx={centro}
          cy={centro}
          r={r}
          stroke={color}
          strokeWidth={trazo}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arco} ${c - arco}`}
        />
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Text style={{ fontSize: 9, fontWeight: '600', color }}>{Math.round(pct)}</Text>
      </View>
    </View>
  );
}

/** Barra de nivel horizontal (depósito). */
export function BarraNivel({ pct, color = '#1E88E5' }: { pct: number; color?: string }) {
  const ancho = Math.min(100, Math.max(0, pct));
  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
      <View className="h-full rounded-full" style={{ width: `${ancho}%`, backgroundColor: color }} />
    </View>
  );
}

/** Gráfica de línea ligera (react-native-svg) para el detalle de planta. */
export function GraficaLinea({
  puntos,
  color = '#1E88E5',
  alto = 130,
  sufijo = '',
}: {
  puntos: number[];
  color?: string;
  alto?: number;
  sufijo?: string;
}) {
  if (puntos.length < 2) {
    return (
      <View className={`items-center justify-center`} style={{ height: alto }}>
        <Text className="text-body-sm text-on-surface-variant">Datos insuficientes</Text>
      </View>
    );
  }
  const ancho = 320;
  const margen = 10;
  const min = Math.min(...puntos);
  const max = Math.max(...puntos);
  const rango = max - min || 1;
  const coordenadas = puntos.map((p, i) => {
    const x = margen + (i / (puntos.length - 1)) * (ancho - margen * 2);
    const y = alto - margen - ((p - min) / rango) * (alto - margen * 2);
    return { x, y };
  });
  const linea = coordenadas.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const area = `M ${coordenadas[0].x},${alto} L ${lineaBox(coordenadas)} L ${coordenadas.at(-1)!.x},${alto} Z`;

  return (
    <View>
      <Svg width="100%" height={alto} viewBox={`0 0 ${ancho} ${alto}`}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0.03" />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#grad)" />
        <Polyline points={linea} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      </Svg>
      <View className="flex-row justify-between px-1">
        <Text style={{ fontSize: 9, color: '#555555' }}>
          mín {fmt(min)} {sufijo}
        </Text>
        <Text style={{ fontSize: 9, color: '#555555' }}>
          máx {fmt(max)} {sufijo}
        </Text>
      </View>
    </View>
  );
}

function lineaBox(coordenadas: { x: number; y: number }[]): string {
  return coordenadas.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' L ');
}

function fmt(n: number): string {
  return String(Math.round(n * 10) / 10);
}
