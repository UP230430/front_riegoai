import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CategoriaRegla, Regla, Umbrales } from '@/types';
import * as reglasService from '@/services/reglasService';
import * as telemetriaService from '@/services/telemetriaService';
import { Header } from '@/components/ui/Header';
import { Vacio, ErrorConReintento, Skeleton, BannerOffline } from '@/components/ui/Estados';
import { RuleCard } from '@/components/RuleCard';
import { ReglaBuilder } from '@/components/ReglaBuilder';
import { Confirmar } from '@/components/Confirmar';
import { useSesion } from '@/store/useSesionStore';
import { useDispositivo, useSimuladorInvalidador } from '@/hooks/useTelemetria';
import { hapticoExito, hapticoToque } from '@/utils/haptico';

const FILTROS: { id: CategoriaRegla | 'todas'; etiqueta: string }[] = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'riego', etiqueta: 'Riego' },
  { id: 'clima', etiqueta: 'Clima' },
  { id: 'iluminacion', etiqueta: 'Iluminación' },
  { id: 'seguridad', etiqueta: 'Seguridad' },
];

/** Categoría automática a partir del sensor de la condición SI. */
function categoriaDe(regla: Omit<Regla, 'id' | 'categoria' | 'bloqueadaPorSeguridad'>): CategoriaRegla {
  if (regla.entonces.accion === 'bloquear') return 'seguridad';
  switch (regla.si.sensor) {
    case 'humedadSuelo':
    case 'nivelDeposito':
      return 'riego';
    case 'temperatura':
      return 'clima';
    case 'luz':
      return 'iluminacion';
    default:
      return 'riego';
  }
}

export default function Reglas() {
  useSimuladorInvalidador();
  const { usuario } = useSesion();
  const esAdmin = (usuario?.rol ?? 'operador') === 'admin';
  const dispositivo = useDispositivo();
  const online = dispositivo.data?.online ?? false;
  const iniciales = (usuario?.nombre ?? 'US').slice(0, 2).toUpperCase();
  const consultas = useQueryClient();

  const reglas = useQuery({ queryKey: ['reglas'], queryFn: reglasService.listarReglas });
  const umbrales = useQuery({ queryKey: ['umbrales'], queryFn: reglasService.obtenerUmbrales });

  const [filtro, setFiltro] = useState<CategoriaRegla | 'todas'>('todas');
  const [builderRegla, setBuilderRegla] = useState<Regla | null>(null);
  const [builderVisible, setBuilderVisible] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [aEliminar, setAEliminar] = useState<Regla | null>(null);
  const [umbralesVisibles, setUmbralesVisibles] = useState(false);

  const alternar = useMutation({
    mutationFn: ({ id, activa }: { id: string; activa: boolean }) => reglasService.alternarRegla(id, activa),
    onSuccess: () => consultas.invalidateQueries({ queryKey: ['reglas'] }),
  });
  const guardar = useMutation({
    mutationFn: (entrada: Parameters<typeof reglasService.guardarRegla>[0]) => reglasService.guardarRegla(entrada),
    onSuccess: () => {
      hapticoExito();
      setBuilderVisible(false);
      setMensaje('Regla guardada y sincronizada con la RPi.');
      void consultas.invalidateQueries({ queryKey: ['reglas'] });
    },
  });
  const probar = useMutation({
    mutationFn: reglasService.probarRegla,
    onSuccess: (texto) => {
      hapticoExito();
      setMensaje(texto);
      void consultas.invalidateQueries({ queryKey: ['reglas'] });
    },
  });
  const eliminar = useMutation({
    mutationFn: reglasService.eliminarRegla,
    onSuccess: () => {
      setAEliminar(null);
      setMensaje('Regla eliminada.');
      void consultas.invalidateQueries({ queryKey: ['reglas'] });
    },
  });
  const fijarUmbrales = useMutation({
    mutationFn: reglasService.guardarUmbrales,
    onSuccess: () => {
      hapticoExito();
      setMensaje('Umbrales actualizados.');
      void consultas.invalidateQueries({ queryKey: ['umbrales'] });
    },
  });

  const visibles = (reglas.data ?? []).filter((r) => filtro === 'todas' || r.categoria === filtro);
  const activas = (reglas.data ?? []).filter((r) => r.activa).length;

  if (reglas.isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <Header tituloPantalla="Reglas" online={online} inicialesUsuario={iniciales} />
        <View className="gap-2 p-space-md">
          <Skeleton alto={24} ancho="40%" />
          <Skeleton alto={140} />
          <Skeleton alto={140} />
        </View>
      </View>
    );
  }

  if (reglas.isError || !reglas.data) {
    return (
      <View className="flex-1 bg-surface">
        <Header tituloPantalla="Reglas" online={online} inicialesUsuario={iniciales} />
        <View className="p-space-md">
          <ErrorConReintento
            mensaje="No se pudieron cargar las reglas."
            intentarDeNuevo={() => void reglas.refetch()}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <Header tituloPantalla="Reglas" online={online} inicialesUsuario={iniciales} />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {!online && (
          <View className="px-gutter-mobile pb-2">
            <BannerOffline ultimaSync={dispositivo.data?.ultimaSync ?? new Date().toISOString()} />
          </View>
        )}

        {/* Banner modo autónomo */}
        <View className="px-gutter-mobile pt-2">
          <View className="flex-row items-center justify-between rounded-2xl bg-primary p-3 shadow-sm">
            <View className="flex-row items-center gap-2">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <MaterialIcons name="psychology" size={22} color="#FFFFFF" />
              </View>
              <View className="flex-col">
                <Text className="text-title-sm font-semibold text-on-primary">Motor de Reglas</Text>
                <Text className="text-label-sm text-on-primary/90">
                  Modo Autónomo · {activas}/{reglas.data.length} activas
                </Text>
              </View>
            </View>
            {esAdmin ? (
              <Pressable
                onPress={() => {
                  hapticoToque();
                  setUmbralesVisibles(true);
                }}
                className="rounded-full bg-white/20 px-3 py-2 min-h-[40px] justify-center"
                accessibilityRole="button"
                accessibilityLabel="Editar umbrales"
              >
                <Text className="text-label-md font-semibold text-on-primary">Umbrales</Text>
              </Pressable>
            ) : (
              <View className="rounded-full bg-white/20 px-3 py-2">
                <Text className="text-label-md text-on-primary/90">🔒 Umbrales</Text>
              </View>
            )}
          </View>
        </View>

        {!esAdmin && (
          <View className="px-gutter-mobile pt-2">
            <View className="flex-row items-start gap-2 rounded-xl bg-surface-container px-3 py-2.5">
              <MaterialIcons name="lock-outline" size={16} color="#555555" />
              <View className="flex-1">
                <Text className="text-label-md font-semibold text-on-surface">Solo lectura · rol Operador</Text>
                <Text className="text-[11px] text-on-surface-variant">
                  Puedes consultar reglas y su historial; solicita al administrador para cambiarlas o probarlas.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Filtros */}
        <ScrollView horizontal className="px-gutter-mobile" contentContainerStyle={{ gap: 6, paddingTop: 10, paddingBottom: 4 }}>
          {FILTROS.map((f) => {
            const sel = filtro === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  hapticoToque();
                  setFiltro(f.id);
                }}
                className={`rounded-full px-3 py-1.5 min-h-[32px] ${sel ? 'bg-primary' : 'bg-surface-container-lowest'}`}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar reglas: ${f.etiqueta}`}
              >
                <Text className={`text-label-md font-semibold ${sel ? 'text-on-primary' : 'text-on-surface'}`}>{f.etiqueta}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {mensaje && (
          <View className="px-gutter-mobile pt-1">
            <View className="rounded-xl bg-secondary-container px-3 py-2">
              <Text className="text-body-sm text-on-secondary-container">{mensaje}</Text>
            </View>
          </View>
        )}

        {/* Lista de reglas */}
        <View className="gap-2 px-gutter-mobile pt-2">
          {visibles.length === 0 ? (
            <Vacio titulo="Sin reglas en esta categoría" descripcion="Prueba otro filtro o crea una nueva regla SI/ENTONCES." />
          ) : (
            visibles.map((regla) => (
              <RuleCard
                key={regla.id}
                regla={regla}
                esAdmin={esAdmin}
                onToggle={(activa) => {
                  if (regla.bloqueadaPorSeguridad) return;
                  void alternar.mutateAsync({ id: regla.id, activa });
                }}
                onEditar={(r) => {
                  hapticoToque();
                  setBuilderRegla(r);
                  setBuilderVisible(true);
                }}
                onProbar={(r) => void probar.mutateAsync(r.id)}
                onEliminar={setAEliminar}
              />
            )))}
        </View>

        {esAdmin && (
          <View className="px-gutter-mobile pt-3">
            <Pressable
              onPress={() => {
                hapticoToque();
                setBuilderRegla(null);
                setBuilderVisible(true);
              }}
              className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline py-3 active:scale-[0.98]"
              accessibilityRole="button"
              accessibilityLabel="Crear nueva regla"
            >
              <MaterialIcons name="add-circle-outline" size={20} color="#2E7D32" />
              <Text className="text-title-sm font-semibold text-primary">Crear nueva regla SI / ENTONCES</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Builder crear/editar */}
      <ReglaBuilder
        visible={builderVisible}
        regla={builderRegla ?? undefined}
        onClose={() => {
          setBuilderVisible(false);
          setBuilderRegla(null);
        }}
        onGuardar={(datos, id) => {
          guardar.mutate({ ...datos, categoria: categoriaDe(datos), bloqueadaPorSeguridad: false, id });
        }}
      />

      {/* Editor de umbrales (admin) */}
      <ModalUmbrales
        visible={umbralesVisibles}
        cerrar={() => setUmbralesVisibles(false)}
        umbrales={umbrales.data ?? null}
        cargando={umbrales.isLoading}
        onGuardar={(u) => fijarUmbrales.mutate(u)}
        ocupado={fijarUmbrales.isPending}
      />

      {/* Confirmar eliminación */}
      <Confirmar
        visible={aEliminar !== null}
        titulo="Eliminar regla"
        descripcion={`¿Eliminar "${aEliminar?.nombre}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        peligroso
        onCancelar={() => setAEliminar(null)}
        onConfirmar={() => aEliminar && void eliminar.mutateAsync(aEliminar.id)}
      />
    </View>
  );
}

/** Modal admin para editar umbrales de seguridad y automatización. */
function ModalUmbrales({
  visible,
  cerrar,
  umbrales,
  cargando,
  onGuardar,
  ocupado,
}: {
  visible: boolean;
  cerrar: () => void;
  umbrales: Umbrales | null;
  cargando: boolean;
  onGuardar: (u: Umbrales) => void;
  ocupado: boolean;
}) {
  const [borrador, setBorrador] = useState<Umbrales | null>(null);
  const actual = borrador ?? umbrales;
  const campos: { clave: keyof Umbrales; etiqueta: string; unidad: string }[] = [
    { clave: 'humedadMinimaPct', etiqueta: 'Humedad mínima de riego', unidad: '%' },
    { clave: 'humedadObjetivoPct', etiqueta: 'Objetivo de rehidratación', unidad: '%' },
    { clave: 'temperaturaVentiladorC', etiqueta: 'Ventilador ON a partir de', unidad: '°C' },
    { clave: 'temperaturaApagadoVentiladorC', etiqueta: 'Ventilador OFF por debajo de', unidad: '°C' },
    { clave: 'depositoCriticoPct', etiqueta: 'Depósito crítico', unidad: '%' },
    { clave: 'maxBombaSeg', etiqueta: 'Tiempo máximo de bomba', unidad: 's' },
    { clave: 'esperaMinRiegosMin', etiqueta: 'Espera mínima entre riegos', unidad: 'min' },
  ];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrar}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[85%] rounded-t-3xl bg-surface-bright p-space-md">
          <View className="flex-row items-center justify-between">
            <Text className="text-title-md text-on-surface">Umbrales del sistema</Text>
            <Pressable onPress={cerrar} accessibilityRole="button" className="h-10 w-10 items-center justify-center">
              <MaterialIcons name="close" size={24} color="#555555" />
            </Pressable>
          </View>
          <ScrollView className="pt-2" contentContainerStyle={{ gap: 10 }}>
            {cargando || !actual ? (
              <Text className="text-body-sm text-on-surface-variant">Cargando umbrales…</Text>
            ) : (
              campos.map((c) => (
                <View key={c.clave} className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 text-body-md text-on-surface">
                    {c.etiqueta} <Text className="text-on-surface-variant">({c.unidad})</Text>
                  </Text>
                  <TextInput
                    value={String(actual[c.clave])}
                    onChangeText={(t) => {
                      const n = parseFloat(t);
                      if (!Number.isNaN(n) && borrador) setBorrador({ ...borrador, [c.clave]: n });
                      else if (!Number.isNaN(n) && umbrales) setBorrador({ ...umbrales, [c.clave]: n });
                    }}
                    keyboardType="decimal-pad"
                    className="w-20 rounded-lg border border-outline-variant px-2 py-1.5 text-body-md text-on-surface"
                  />
                </View>
              ))
            )}
          </ScrollView>
          <View className="pt-3">
            <Pressable
              disabled={!borrador || ocupado}
              onPress={() => borrador && onGuardar(borrador)}
              className={`min-h-[48px] items-center justify-center rounded-xl bg-primary ${!borrador || ocupado ? 'opacity-50' : ''}`}
              accessibilityRole="button"
              accessibilityLabel="Guardar umbrales"
            >
              <Text className="text-label-lg font-semibold text-on-primary">
                {ocupado ? 'Guardando…' : 'Guardar umbrales'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
