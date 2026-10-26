import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { useRef, useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Vacio, ErrorConReintento } from '@/components/ui/Estados';
import { Select, type Opcion } from '@/components/ui/Select';
import { TimelineItem } from '@/components/TimelineItem';
import { useDispositivo } from '@/hooks/useTelemetria';
import * as timelineService from '@/services/timelineService';
import { useSesion } from '@/store/useSesionStore';
import { exportarCsv } from '@/services/timelineService';
import { hapticoToque } from '@/utils/haptico';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

type FiltroTipo = 'todo' | 'riego' | 'alerta' | 'clima' | 'ia';
type FiltroPlanta = string; // 'todas' | id
type FiltroRango = 'hoy' | 'semana' | 'mes';

const OPCIONES_TIPO: Opcion<FiltroTipo>[] = [
  { valor: 'todo', etiqueta: 'Todo' },
  { valor: 'riego', etiqueta: '💧 Riegos' },
  { valor: 'alerta', etiqueta: '⚠️ Alertas' },
  { valor: 'clima', etiqueta: '🌡️ Clima' },
  { valor: 'ia', etiqueta: '🤖 Azure IA' },
];

const OPCIONES_RANGO: Opcion<FiltroRango>[] = [
  { valor: 'hoy', etiqueta: '📅 Hoy' },
  { valor: 'semana', etiqueta: 'Últimos 7 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
];

export default function Timeline() {
  const { usuario } = useSesion();
  const dispositivo = useDispositivo();
  const qc = useQueryClient();
  const online = dispositivo.data?.online ?? false;
  const iniciales = (usuario?.nombre ?? 'US').slice(0, 2).toUpperCase();

  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todo');
  const [filtroPlanta, setFiltroPlanta] = useState<FiltroPlanta>('todas');
  const [filtroRango, setFiltroRango] = useState<FiltroRango>('semana');
  const listaRef = useRef<FlatList>(null);

  const eventos = useInfiniteQuery({
    queryKey: ['eventos', filtroTipo, filtroPlanta, filtroRango],
    queryFn: ({ pageParam }) =>
      timelineService.listarEventos({ tipo: filtroTipo, plantaId: filtroPlanta, pagina: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (ultima) => ultima.siguientePagina ?? undefined,
  });

  const todas = eventos.data?.pages.flatMap((p) => p.eventos) ?? [];
  const total = eventos.data?.pages[0]?.totalFiltrado ?? 0;

  // KPIs del día (basados en eventos del mock)
  const hoy = new Date().toDateString();
  const eventosHoy = todas.filter((e) => new Date(e.fecha).toDateString() === hoy);
  const riegosHoy = eventosHoy.filter((e) => e.tipo === 'riego');
  const mlHoy = riegosHoy.reduce((a, e) => a + (e.volumenMl ?? 0), 0);
  const alertasHoy = eventosHoy.filter((e) => e.tipo === 'alerta').length;

  const opcionesPlanta: Opcion<FiltroPlanta>[] = [
    { valor: 'todas', etiqueta: '🌱 Todas las plantas' },
    { valor: 'albahaca-1', etiqueta: '🌿 Albahaca #1' },
    { valor: 'tomate-1', etiqueta: '🍅 Tomate Cherry' },
    { valor: 'menta-1', etiqueta: '🍃 Menta Piperita' },
  ];

  function restablecerFiltros() {
    setFiltroTipo('todo');
    setFiltroPlanta('todas');
    setFiltroRango('semana');
    void eventos.refetch();
  }

  function filtrarPorRango(semillas: typeof todas): typeof todas {
    const ahora = Date.now();
    const ms = filtroRango === 'hoy' ? 24 * 3600e3 : filtroRango === 'semana' ? 7 * 24 * 3600e3 : 30 * 24 * 3600e3;
    return semillas.filter((e) => ahora - new Date(e.fecha).getTime() <= ms);
  }

  async function compartirCsv() {
    const csv = exportarCsv();
    try {
      const archivo = new FileSystem.File(FileSystem.Paths.cache, 'riegosmart-timeline.csv');
      archivo.write(csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(archivo.uri, { mimeType: 'text/csv', dialogTitle: 'Exportar historial' });
      }
    } catch {
      // Web en demo: sin sharer.
    }
  }

  if (eventos.isError) {
    return (
      <View className="flex-1 bg-surface">
        <Header tituloPantalla="Timeline" online={online} inicialesUsuario={iniciales} />
        <View className="p-4">
          <ErrorConReintento mensaje="No se pudieron cargar los eventos." intentarDeNuevo={() => void eventos.refetch()} />
        </View>
      </View>
    );
  }

  return (
    <View className="relative flex-1 bg-surface">
      {/* Línea vertical conectora del timeline */}
      <View className="absolute bg-surface-container-high" style={{ left: 27, top: 88, bottom: 104, width: 2 }} />
      <Header tituloPantalla="Timeline" online={online} inicialesUsuario={iniciales} />
      <FlatList
        ref={listaRef}
        data={filtrarPorRango(todas)}
        keyExtractor={(e) => e.id}
        onRefresh={() => void eventos.refetch()}
        refreshing={eventos.isRefetching}
        onEndReached={() => {
          if (eventos.hasNextPage && !eventos.isFetchingNextPage) void eventos.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View className="px-4 pb-1 pt-2">
            {/* Título de pantalla */}
            <View className="flex-row items-center justify-between pt-2">
              <View className="flex-col">
                <Text className="text-headline-lg-mobile text-on-surface" style={{ fontWeight: '700' }}>
                  Timeline
                </Text>
                <Text className="text-body-sm text-on-surface-variant">
                  Línea temporal de riegos, eventos y alertas del invernadero
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  hapticoToque();
                  void compartirCsv();
                }}
                className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-high active:scale-95"
                accessibilityRole="button"
                accessibilityLabel="Exportar historial a CSV"
              >
                <MaterialCommunityIcons name={"share" as never} size={20} color="#1B1B1B" />
              </Pressable>
            </View>

            {/* KPIs del día */}
            <Card className="mt-3 flex-row items-center justify-between">
              <View className="flex-1 items-center">
                <MaterialIcons name="water-drop" size={16} color="#0060a8" />
                <Text className="text-label-sm font-semibold uppercase text-secondary" style={{ fontSize: 10 }}>
                  Riegos hoy
                </Text>
                <Text className="mt-0.5 text-title-md text-on-surface">
                  {riegosHoy.length} <Text className="text-label-md font-normal text-on-surface-variant">({mlHoy} mL)</Text>
                </Text>
              </View>
              <View className="h-8 w-px bg-surface-container-highest" />
              <View className="flex-1 items-center">
                <MaterialIcons name="notifications-active" size={16} color="#FB8C00" />
                <Text className="text-label-sm font-semibold uppercase text-tertiary" style={{ fontSize: 10 }}>
                  Alertas
                </Text>
                <View className="mt-0.5 flex-row items-center gap-1">
                  <Text className="text-title-md text-on-surface">{alertasHoy}</Text>
                  {alertasHoy > 0 && <View className="h-2 w-2 rounded-full bg-error" />}
                </View>
              </View>
              <View className="h-8 w-px bg-surface-container-highest" />
              <View className="flex-1 items-center">
                <MaterialIcons name="verified" size={16} color="#2E7D32" />
                <Text className="text-label-sm font-semibold uppercase text-primary" style={{ fontSize: 10 }}>
                  Eficiencia
                </Text>
                <Text className="mt-0.5 text-title-md text-primary">96%</Text>
              </View>
            </Card>

            {/* Filtros */}
            <View className="mt-3 flex-row gap-2">
              <Select valor={filtroPlanta} opciones={opcionesPlanta} onChange={(v) => { setFiltroPlanta(v); }} />
              <Select valor={filtroRango} opciones={OPCIONES_RANGO} onChange={setFiltroRango} />
            </View>

            {/* Chips por categoría */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} className="mt-2 py-1">
              {OPCIONES_TIPO.map((o) => (
                <Chip
                  key={o.valor}
                  texto={o.etiqueta}
                  activo={filtroTipo === o.valor}
                  conteo={o.valor === 'todo' && filtroPlanta === 'todas' && filtroRango === 'semana' ? total : undefined}
                  onPress={() => {
                    hapticoToque();
                    setFiltroTipo(o.valor);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          eventos.isLoading ? (
            <View className="gap-2 p-4">
              <View className="h-24 rounded-xl bg-surface-container-high" />
              <View className="h-24 rounded-xl bg-surface-container-high" />
              <View className="h-24 rounded-xl bg-surface-container-high" />
            </View>
          ) : (
            <View className="p-4">
              <Vacio
                titulo="No hay eventos que coincidan"
                descripcion="Prueba cambiando de categoría o selecciona otra planta."
                accionTexto="Restablecer filtros"
                accionOn={restablecerFiltros}
              />
            </View>
          )
        }
        ListFooterComponent={
          eventos.isFetchingNextPage ? (
            <Text className="py-4 text-center text-label-md text-on-surface-variant">Cargando más…</Text>
          ) : (
            <View />
          )
        }
        renderItem={({ item }) => <TimelineItem evento={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 96 }}
      />

      {/* Pie: acciones secundarias */}
      <View className="absolute inset-x-0 bottom-16 flex-row items-center justify-between bg-surface/95 px-4 py-2">
        <Pressable
          onPress={() => {
            void timelineService.limpiarHistorial().then(() => {
              qc.invalidateQueries({ queryKey: ['eventos'] });
            });
          }}
          className="flex-row items-center gap-1 rounded-lg px-2 py-1.5 min-h-[44px]"
          accessibilityRole="button"
        >
          <MaterialIcons name="delete-sweep" size={16} color="#555555" />
          <Text className="text-label-md text-on-surface-variant">Limpiar historial</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            hapticoToque();
            void compartirCsv();
          }}
          className="flex-row items-center gap-1 rounded-lg px-2 py-1.5 min-h-[44px]"
          accessibilityRole="button"
        >
          <MaterialIcons name="file-download" size={16} color="#2E7D32" />
          <Text className="text-label-md text-primary" style={{ fontWeight: '500' }}>Descargar CSV</Text>
        </Pressable>
      </View>
    </View>
  );
}
