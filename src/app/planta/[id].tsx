import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { AnilloProgreso, GraficaLinea } from '@/components/Graficas';
import {
  useHistorialPlanta,
  useLecturas,
  usePlanta,
  usePrediccion,
  useSimuladorInvalidador,
} from '@/hooks/useTelemetria';
import { etiquetaEstadoSalud } from '@/utils/formato';
import { proximoRelativo } from '@/utils/formato';
import { riegosACsv } from '@/utils/csv';
import { hapticoToque } from '@/utils/haptico';

type Rango = 'dia' | 'semana';

export default function DetallePlanta() {
  useSimuladorInvalidador();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ?? 'albahaca-1';

  const planta = usePlanta(id);
  const historial = useHistorialPlanta(id);
  const prediccion = usePrediccion(id);
  const lecturas = useLecturas();
  const [rango, setRango] = useState<Rango>('semana');

  if (planta.isLoading || !planta.data) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-body-md text-on-surface-variant">Cargando planta…</Text>
      </View>
    );
  }

  if (planta.isError) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-surface px-6">
        <Text className="text-body-md text-error">No se encontró la planta.</Text>
        <Pressable
          onPress={() => router.back()}
          className="rounded-xl bg-primary px-4 py-3"
          accessibilityRole="button"
        >
          <Text className="text-label-lg font-semibold text-on-primary">Volver</Text>
        </Pressable>
      </View>
    );
  }

  const p = planta.data;
  const salud = etiquetaEstadoSalud(p.diagnostico.estado);
  const serie = historial.data ?? [];
  const humedadSerie = serie.map((d) => d.humedad);
  const tempSerie = serie.map((d) => d.temperatura);
  const luzSerie = serie.map((d) => d.luz);
  const aguaSerie = serie.map((d) => d.aguaMl);

  async function compartirCsv() {
    if (!historial.data) return;
    const csv = riegosACsv(
      historial.data.map((d) => ({
        inicio: d.dia,
        origen: 'invernadero',
        duracionSeg: 10,
        volumenMl: d.aguaMl,
      })),
    );
    try {
      const archivo = new FileSystem.File(FileSystem.Paths.cache, `riegosmart-historial-${p.id}.csv`);
      archivo.write(csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(archivo.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Compartir historial de riegos',
        });
      }
    } catch {
      // En la demo web el sharer puede no estar disponible; se omite.
    }
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Encabezado con retro */}
      <View className="h-16 flex-row items-center gap-2 px-gutter-mobile pt-2">
        <Pressable
          onPress={() => {
            hapticoToque();
            router.back();
          }}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-low"
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialIcons name="arrow-back" size={20} color="#1B1B1B" />
        </Pressable>
        <View className="flex-col">
          <Text className="text-title-md text-on-surface" style={{ fontWeight: '600' }}>
            {p.nombre}
          </Text>
          <Text className="text-body-sm text-on-surface-variant" style={{ fontStyle: 'italic' }}>
            {p.nombreCientifico}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-gutter-mobile">
        {/* Cabecera */}
        <Card className="flex-row items-center gap-3">
          <Image source={{ uri: p.imagenUrl }} style={{ width: 64, height: 64, borderRadius: 12 }} />
          <View className="flex-1">
            <Text className="text-title-sm text-on-surface" style={{ fontWeight: '600' }}>
              {p.sector} · {p.nombre}
            </Text>
            <Text className="text-label-sm text-on-surface-variant">Riego sugerido: {p.riegoSugeridoMl} mL · cada {p.intervaloRiegoHoras} h</Text>
            <View className="mt-1 self-start rounded-full bg-primary-container px-2 py-0.5">
              <Text className="text-label-sm font-semibold text-on-primary-container">
                {salud.texto} · {p.diagnostico.vigorPct}%
              </Text>
            </View>
          </View>
        </Card>

        {/* Condiciones óptimas + diagnóstico */}
        <Card className="mt-2 gap-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-label-sm text-on-surface-variant">Diagnóstico IA</Text>
              <Text className="text-title-sm text-on-surface" style={{ fontWeight: '600' }}>
                {salud.texto}
              </Text>
              <Text className="text-body-sm text-on-surface-variant">{p.diagnostico.descripcion}</Text>
            </View>
            <AnilloProgreso pct={p.diagnostico.vigorPct} color="#2E7D32" />
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1 gap-1 rounded-xl bg-surface-container-low p-2">
              <Text className="text-label-sm font-semibold text-secondary">Humedad óptima</Text>
              <Text className="text-title-sm text-on-surface">
                {p.humedadOptima[0]}% - {p.humedadOptima[1]}%
              </Text>
              <Text className="text-label-sm text-on-surface-variant">
                Actual: {lecturas.data?.humedadSuelo ?? '—'}%
              </Text>
            </View>
            <View className="flex-1 gap-1 rounded-xl bg-surface-container-low p-2">
              <Text className="text-label-sm font-semibold text-tertiary">Térmico óptimo</Text>
              <Text className="text-title-sm text-on-surface">
                {p.temperaturaOptima[0]}°C - {p.temperaturaOptima[1]}°C
              </Text>
              <Text className="text-label-sm text-on-surface-variant">
                Actual: {lecturas.data?.temperatura ?? '—'} °C
              </Text>
            </View>
          </View>
        </Card>

        {/* Selector rango + gráficas */}
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-title-md text-on-surface">Telemetría</Text>
          <View className="flex-row gap-1 rounded-full bg-surface-container p-1">
            {(['dia', 'semana'] as Rango[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => {
                  hapticoToque();
                  setRango(r);
                }}
                className={`rounded-full px-3 py-1 ${rango === r ? 'bg-surface-container-lowest' : ''}`}
                accessibilityLabel={`Rango ${r}`}
              >
                <Text className={`text-label-md font-semibold ${rango === r ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {r === 'dia' ? 'Día' : 'Semana'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-2 gap-2">
          {(
            [
              { titulo: 'Humedad de suelo (%)', puntos: humedadSerie, color: '#1E88E5', sufijo: '%' },
              { titulo: 'Temperatura (°C)', puntos: tempSerie, color: '#FB8C00', sufijo: '°C' },
              { titulo: 'Luz (lx)', puntos: luzSerie, color: '#2E7D32', sufijo: 'lx' },
              { titulo: 'Agua suministrada (mL/día)', puntos: aguaSerie, color: '#0060a8', sufijo: 'mL' },
            ] as const
          ).map((g) => (
            <Card key={g.titulo}>
              <Text className="text-label-sm text-on-surface-variant">{g.titulo}</Text>
              <GraficaLinea puntos={[...g.puntos]} alto={120} color={g.color} sufijo={g.sufijo} />
            </Card>
          ))}
        </View>

        {/* Predicción */}
        <Card className="mt-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-label-md text-on-surface-variant">Predicción de riego</Text>
            <View className="rounded-full bg-primary-container px-2 py-0.5">
              <Text className="text-label-sm font-semibold text-on-primary-container">
                Tendencia {prediccion.data?.tendencia ?? 'estable'}
              </Text>
            </View>
          </View>
          <Text className="text-title-lg text-primary" style={{ fontWeight: '600' }}>
            {prediccion.data ? proximoRelativo(prediccion.data.proximoRiegoEstimado) : '—'}
          </Text>
          <Text className="text-body-sm text-on-surface-variant">
            {prediccion.data
              ? `≈ ${prediccion.data.volumenSugeridoMl} mL sugeridos · ${prediccion.data.resumen}`
              : 'Calculando…'}
          </Text>
        </Card>

        <Pressable
          onPress={() => void compartirCsv()}
          className="mt-4 min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl bg-surface-container-low py-3"
          accessibilityRole="button"
        >
          <MaterialIcons name="file-download" size={18} color="#2E7D32" />
          <Text className="text-label-lg font-semibold text-primary">Compartir historial (CSV)</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
