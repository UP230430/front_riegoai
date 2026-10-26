import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { BotonPill } from '@/components/ui/Botones';
import { ActuadorRow, FilaAccion } from '@/components/ui/ActuadorRow';
import { BannerOffline, Vacio } from '@/components/ui/Estados';
import { AnilloProgreso, BarraNivel } from '@/components/Graficas';
import { Confirmar } from '@/components/Confirmar';
import {
  useActuador,
  useDispositivo,
  useLecturas,
  usePlantas,
  usePrediccion,
  useRegarAhora,
  useSimuladorInvalidador,
} from '@/hooks/useTelemetria';
import { useSesion } from '@/store/useSesionStore';
import { MAX_REGADO_ML } from '@/services/telemetriaService';
import { etiquetaEstadoSalud, proximoRelativo, relativo } from '@/utils/formato';
import { hapticoAviso, hapticoExito, hapticoError, hapticoToque } from '@/utils/haptico';
import { useQuery } from '@tanstack/react-query';
import * as telemetriaService from '@/services/telemetriaService';

const PRESETS_ML = [120, 180, 250];

export default function Inicio() {
  useSimuladorInvalidador();
  const { usuario } = useSesion();
  const esAdmin = (usuario?.rol ?? 'operador') === 'admin';

  const plantas = usePlantas();
  const lecturas = useLecturas();
  const dispositivo = useDispositivo();
  const regar = useRegarAhora();
  const actuador = useActuador();

  const [plantaId, setPlantaId] = useState('albahaca-1');
  const [modalRegar, setModalRegar] = useState(false);
  const [volumenSeleccionado, setVolumenSeleccionado] = useState(180);
  const [confirmarParada, setConfirmarParada] = useState(false);

  const online = dispositivo.data?.online ?? false;
  const plantaActual = plantas.data?.find((p) => p.id === plantaId) ?? plantas.data?.[0];
  const ultimo = useQuery({
    queryKey: ['ultimoRiego', plantaActual?.id],
    queryFn: () => telemetriaService.ultimoRiego(plantaActual?.id ?? ''),
  });
  const prediccion = usePrediccion(plantaActual?.id ?? 'albahaca-1');

  const humedad = plantaActual?.diagnostico.humedadSueloPct ?? lecturas.data?.humedadSuelo ?? 0;
  const nivelDeposito = lecturas.data?.nivelDeposito ?? 0;
  const bombaOn = dispositivo.data?.bomba ?? false;
  const ventiladorOn = dispositivo.data?.ventilador ?? false;
  const ledsOn = dispositivo.data?.leds ?? false;
  const iniciales = (usuario?.nombre ?? 'US').slice(0, 2).toUpperCase();

  function abrirRegar() {
    hapticoToque();
    setVolumenSeleccionado(plantaActual?.riegoSugeridoMl ?? 180);
    setModalRegar(true);
  }

  async function confirmarRegar() {
    if (!plantaActual) return;
    setModalRegar(false);
    try {
      await regar.mutateAsync({
        plantaId: plantaActual.id,
        volumenMl: volumenSeleccionado,
        operador: usuario?.nombre ?? 'Operador',
      });
      hapticoExito();
    } catch (e) {
      hapticoError();
      if (e instanceof Error) console.warn('regar:', e.message);
    }
  }

  function intentarDeNuevo() {
    void plantas.refetch();
    void lecturas.refetch();
    void dispositivo.refetch();
  }

  if (plantas.isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <Header tituloPantalla="Inicio" online={online} inicialesUsuario={iniciales} />
        <Vacio titulo="Cargando invernadero…" descripcion="Sincronizando plantas, sensores y GPIO." />
      </View>
    );
  }

  if (plantas.isError || !plantas.data) {
    return (
      <View className="flex-1 bg-surface">
        <Header tituloPantalla="Inicio" online={online} inicialesUsuario={iniciales} />
        <Vacio
          titulo="No se pudo cargar"
          descripcion="Revisa tu conexión y vuelve a intentarlo."
          accionTexto="Reintentar"
          accionOn={intentarDeNuevo}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <Header tituloPantalla="Inicio" online={online} inicialesUsuario={iniciales} />
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        {!online && (
          <View className="px-gutter-mobile pb-2">
            <BannerOffline ultimaSync={dispositivo.data?.ultimaSync ?? new Date().toISOString()} />
          </View>
        )}

        {/* Carrusel de cultivos */}
        <View className="px-gutter-mobile pt-1">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-title-sm text-on-surface">Mis Cultivos</Text>
            <View className="flex-row items-center gap-0.5">
              <MaterialIcons name="sensors" size={15} color="#2E7D32" />
              <Text className="text-label-sm font-semibold text-primary">{plantas.data.length} Zonas Activas</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="py-1"
            contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
          >
            {plantas.data.map((p) => {
              const sel = p.id === plantaId;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    hapticoToque();
                    setPlantaId(p.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver planta ${p.nombre}`}
                  className={`flex-row items-center gap-2 rounded-full px-2 py-1.5 shadow-sm active:scale-95 ${sel ? 'bg-primary' : 'bg-surface-container-lowest'}`}
                >
                  <Image source={{ uri: p.imagenUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                  <View className="flex-col pr-2">
                    <Text className={`text-label-md leading-none ${sel ? 'font-semibold text-on-primary' : 'text-on-surface'}`}>
                      {p.nombre}
                    </Text>
                    <Text className={`text-label-sm leading-[14px] ${sel ? 'text-on-primary/90' : 'text-on-surface-variant'}`}>
                      {p.subtitulo}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => router.push('/vivero-mapa')}
              className="flex-row items-center justify-center gap-1.5 rounded-full bg-surface-container-low px-3 py-2"
              accessibilityRole="button"
              accessibilityLabel="Añadir planta"
            >
              <MaterialIcons name="add" size={18} color="#1B1B1B" />
              <Text className="text-label-md font-medium text-on-surface">Añadir</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Banner diagnóstico IA */}
        <View className="px-gutter-mobile pt-2">
          <Card className="flex-row items-center justify-between">
            <View className="min-w-0 flex-row items-center gap-2" style={{ flex: 1 }}>
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-container">
                <MaterialIcons name="psychology" size={22} color="#1B5E20" />
              </View>
              <View className="min-w-0 flex-col" style={{ flex: 1 }}>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-title-sm text-on-surface" numberOfLines={1}>
                    Diagnóstico Azure AI
                  </Text>
                  <View className="rounded-full bg-primary-container px-2 py-0.5">
                    <Text className="text-label-sm font-semibold text-on-primary-container">
                      {plantaActual?.diagnostico.vigorPct ?? '—'}% Vigor
                    </Text>
                  </View>
                </View>
                <Text className="text-body-sm text-on-surface-variant" numberOfLines={1}>
                  {plantaActual
                    ? `${plantaActual.diagnostico.descripcion}`
                    : 'Analizando follaje…'}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => plantaActual && router.push(`/planta/${plantaActual.id}`)}
              className="flex-row items-center gap-0.5 pl-1"
            >
              <Text className="text-label-sm font-semibold text-primary">Detalles</Text>
              <MaterialIcons name="chevron-right" size={16} color="#2E7D32" />
            </Pressable>
          </Card>
        </View>

        {/* Telemetría y accionadores */}
        <View className="gap-2 px-gutter-mobile pt-3">
          <View className="flex-row items-center justify-between px-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-title-md text-on-surface">Telemetría y Accionadores</Text>
              <View className="rounded-full bg-secondary-container px-2 py-0.5">
                <Text className="text-label-sm font-medium text-on-secondary-container">GPIO Sync</Text>
              </View>
            </View>
            <Text className="text-label-sm text-on-surface-variant">Toca para accionar</Text>
          </View>

          {/* 1 · Humedad + bomba */}
          <Card>
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary-container">
                  <MaterialIcons name="water-drop" size={22} color="#0D47A1" />
                </View>
                <View className="flex-col">
                  <Text className="text-label-sm text-on-surface-variant">
                    Humedad Sustrato · Sonda A0
                  </Text>
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="text-headline-sm font-bold text-on-surface">{humedad}%</Text>
                    <Text className="text-label-sm font-medium text-primary">
                      Óptimo ({plantaActual?.humedadOptima[0]}-{plantaActual?.humedadOptima[1]}%)
                    </Text>
                  </View>
                </View>
              </View>
              <AnilloProgreso pct={humedad} />
            </View>
            <View className="pt-2">
              <FilaAccion
                icono={bombaOn ? 'water-pump' : 'play-circle'}
                colorIcono="#1E88E5"
                titulo="Bomba Sumergible (GPIO 17)"
                subtitulo={bombaOn ? 'RPi GPIO 17: Activo · Dosificando…' : 'En reposo · Pulso manual'}
                deshabilitado={!online}
                motivoBloqueo={!online ? 'RPi Offline: control manual deshabilitado' : undefined}
                onPress={abrirRegar}
                derecha={
                  <BotonPill
                    texto={bombaOn ? 'Regando…' : `Regar ${plantaActual?.riegoSugeridoMl ?? 180} mL`}
                    deshabilitado={!online || bombaOn}
                    onPress={abrirRegar}
                  />
                }
              />
            </View>
          </Card>

          {/* 2 · Temperatura + ventilador */}
          <Card>
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-tertiary-container">
                  <MaterialIcons name="device-thermostat" size={22} color="#E65100" />
                </View>
                <View className="flex-col">
                  <Text className="text-label-sm text-on-surface-variant">Temperatura Ambiente · DHT22</Text>
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="text-headline-sm font-bold text-on-surface">
                      {lecturas.data?.temperatura ?? '—'} °C
                    </Text>
                    <Text className="text-label-sm font-medium text-tertiary">
                      {(lecturas.data?.temperatura ?? 0) >= 30 ? 'Calor' : 'Templado'}
                    </Text>
                  </View>
                </View>
              </View>
              {ventiladorOn && (
                <View className="rounded-full bg-tertiary-container px-2.5 py-1">
                  <Text className="text-label-sm font-semibold text-on-tertiary-container">Fan Activo</Text>
                </View>
              )}
            </View>
            <View className="pt-2">
              <ActuadorRow
                icono="fan"
                colorIcono="#FB8C00"
                titulo="Ventilador Extractor (GPIO 27)"
                subtitulo={ventiladorOn ? 'PWM 50% · En marcha' : 'Apagado'}
                activo={ventiladorOn}
                permitido={online}
                motivoBloqueo="RPi Offline: no se puede accionar el extractor"
                onChange={(v) => void actuador.mutateAsync({ tipo: 'ventilador', valor: v }).then(() => hapticoExito())}
              />
            </View>
          </Card>

          {/* 3 · Luz + LED grow */}
          <Card>
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-container">
                  <MaterialIcons name="wb-sunny" size={22} color="#1B5E20" />
                </View>
                <View className="flex-col">
                  <Text className="text-label-sm text-on-surface-variant">Radiación Lumínica · BH1750</Text>
                  <View className="flex-row items-baseline gap-1.5">
                    <Text className="text-headline-sm font-bold text-on-surface">
                      {(lecturas.data?.luz ?? 0).toLocaleString('es-MX')} lx
                    </Text>
                    <Text className="text-label-sm font-medium text-primary">Fotosíntesis Alta</Text>
                  </View>
                </View>
              </View>
              <View className="rounded-full bg-primary-container px-2.5 py-1">
                <Text className="text-label-sm font-semibold text-on-primary-container">{ledsOn ? 'LED On' : 'LED Off'}</Text>
              </View>
            </View>
            <View className="pt-2">
              <ActuadorRow
                icono="lightbulb"
                colorIcono="#2E7D32"
                titulo="Luminaria Espectro Completo (GPIO 22)"
                subtitulo={ledsOn ? 'Atenuación PWM 80%' : 'Apagada'}
                activo={ledsOn}
                permitido={online}
                motivoBloqueo="RPi Offline: no se puede accionar la luminaria"
                onChange={(v) => void actuador.mutateAsync({ tipo: 'leds', valor: v })}
              />
            </View>
          </Card>

          {/* Fila 2 col: depósito + programa */}
          <View className="flex-row gap-2">
            <Card className="flex-1 justify-between gap-2">
              <View className="flex-row items-center justify-between">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-secondary-container">
                  <MaterialIcons name="inventory-2" size={18} color="#0D47A1" />
                </View>
                <Text className="text-label-sm text-on-surface-variant">Ultrasonido</Text>
              </View>
              <View>
                <Text className="text-label-sm text-on-surface-variant">Depósito Principal</Text>
                <Text className="text-title-lg font-bold text-on-surface">
                  {nivelDeposito}% <Text className="text-body-sm font-normal text-on-surface-variant">/ 5.0 L</Text>
                </Text>
              </View>
              <BarraNivel pct={nivelDeposito} color={nivelDeposito < 15 ? '#E53935' : nivelDeposito < 30 ? '#FB8C00' : '#1E88E5'} />
              {nivelDeposito < 15 && (
                <View className="rounded-lg bg-error-container px-2 py-1">
                  <Text className="text-label-sm font-semibold text-on-error-container">Depósito bajo · rellenar pronto</Text>
                </View>
              )}
              <View className="flex-row items-center justify-between pt-1">
                <Text className="text-label-sm text-on-surface-variant">Válvula Inflow</Text>
                <BotonPill
                  texto={(dispositivo.data?.valvulaLlenado ?? false) ? 'Abierta' : 'Cerrada'}
                  tono="primario"
                  deshabilitado={!online}
                  onPress={() => void actuador.mutateAsync({ tipo: 'valvula', valor: !(dispositivo.data?.valvulaLlenado ?? false) })}
                />
              </View>
            </Card>

            <Card className="flex-1 justify-between gap-2">
              <View className="flex-row items-center justify-between">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary-container">
                  <MaterialIcons name="schedule" size={18} color="#1B5E20" />
                </View>
                <Text className="text-label-sm font-semibold text-primary">Programado</Text>
              </View>
              <View>
                <Text className="text-label-sm text-on-surface-variant">Último Riego</Text>
                <Text className="text-title-lg font-bold text-on-surface">
                  {ultimo.data ? `${ultimo.data.volumenMl} mL` : '—'}
                </Text>
                <Text className="text-label-sm text-on-surface-variant">
                  {ultimo.data ? relativo(ultimo.data.inicio) : 'Sin registros'}
                </Text>
              </View>
              <View className="flex-col rounded-lg bg-surface-container-low p-1.5">
                <Text className="text-label-sm text-on-surface-variant">Próximo estimado:</Text>
                <Text className="text-label-md font-semibold text-primary">
                  {prediccion.data
                    ? `${new Date(prediccion.data.proximoRiegoEstimado).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} h · ${proximoRelativo(prediccion.data.proximoRiegoEstimado)} (~${prediccion.data.volumenSugeridoMl} mL)`
                    : '—'}
                </Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Matriz RPi GPIO */}
        <View className="px-gutter-mobile pt-3">
          <Card>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <View className="h-8 w-8 items-center justify-center rounded-lg bg-surface-container-highest">
                  <MaterialIcons name="developer-board" size={18} color="#1B1B1B" />
                </View>
                <View className="flex-col">
                  <Text className="text-title-sm text-on-surface">Matriz RPi GPIO</Text>
                  <Text className="text-label-sm text-on-surface-variant">Raspberry Pi 4B · 4 pines asignados</Text>
                </View>
              </View>
              {esAdmin && online ? (
                <Pressable
                  onPress={() => void actuador.mutateAsync({ tipo: 'modoAuto', valor: !(dispositivo.data?.modoAuto ?? true) }).then(() => hapticoExito())}
                  className={`rounded-full px-2.5 py-1 ${dispositivo.data?.modoAuto ? 'bg-primary-container' : 'bg-tertiary-container'}`}
                  accessibilityLabel="Alternar modo automático"
                >
                  <Text className="text-label-sm font-semibold text-on-primary-container">
                    {dispositivo.data?.modoAuto ? 'Modo Auto IA' : 'Modo Manual'}
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
                colorIcono="#1E88E5"
                titulo="Relé Bomba de Riego"
                subtitulo="BCM GPIO 17 (Pin 11)"
                activo={bombaOn}
                permitido={esAdmin && online}
                motivoBloqueo={esAdmin ? 'RPi Offline' : 'Solo admin: usa la tarjeta de humedad para regar'}
                onChange={(v) => void actuador.mutateAsync({ tipo: 'online', valor: v })}
              />
              <ActuadorRow
                icono="air-filter"
                colorIcono="#FB8C00"
                titulo="Ventilación Extractor"
                subtitulo="BCM GPIO 27 (Pin 13)"
                activo={ventiladorOn}
                permitido={esAdmin && online}
                motivoBloqueo={esAdmin ? 'RPi Offline' : 'Solo admin desde la matriz'}
                onChange={(v) => void actuador.mutateAsync({ tipo: 'ventilador', valor: v })}
              />
              <ActuadorRow
                icono="lightbulb"
                colorIcono="#2E7D32"
                titulo="Panel Fotónico LED"
                subtitulo="BCM GPIO 22 (Pin 15)"
                activo={ledsOn}
                permitido={esAdmin && online}
                motivoBloqueo={esAdmin ? 'RPi Offline' : 'Solo admin desde la matriz'}
                onChange={(v) => void actuador.mutateAsync({ tipo: 'leds', valor: v })}
              />
              <ActuadorRow
                icono="valve"
                colorIcono="#555555"
                titulo="Válvula de Llenado Red"
                subtitulo="BCM GPIO 24 (Pin 18)"
                activo={dispositivo.data?.valvulaLlenado ?? false}
                permitido={esAdmin && online}
                motivoBloqueo={esAdmin ? 'RPi Offline' : 'Solo admin desde la matriz'}
                onChange={(v) => void actuador.mutateAsync({ tipo: 'valvula', valor: v })}
              />
            </View>

            {esAdmin ? (
              <Pressable
                onPress={() => {
                  hapticoAviso();
                  setConfirmarParada(true);
                }}
                className="mt-2 min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl bg-error-container py-3 active:scale-[0.98]"
                accessibilityRole="button"
                accessibilityLabel="Parada de emergencia general"
              >
                <MaterialIcons name="power-settings-new" size={18} color="#B71C1C" />
                <Text className="text-label-md font-semibold text-on-error-container">
                  Parada de Emergencia General
                </Text>
              </Pressable>
            ) : (
              <View
                className="mt-2 min-h-[48px] flex-row items-center justify-center gap-2 rounded-xl bg-surface-container py-3"
                accessibilityLabel="Parada de emergencia: solo administrador"
              >
                <MaterialCommunityIcons name="lock" size={16} color="#555555" />
                <Text className="text-label-md text-on-surface-variant">
                  Parada de emergencia · Solo admin
                </Text>
              </View>
            )}
          </Card>
        </View>
      </ScrollView>

      {/* Modal de regado: mL o segundos, límite seguro */}
      <ModalRegar
        visible={modalRegar}
        cerrar={() => setModalRegar(false)}
        planta={plantaActual?.nombre ?? 'Planta'}
        sugerido={plantaActual?.riegoSugeridoMl ?? 180}
        seleccion={volumenSeleccionado}
        onSelect={(ml) => setVolumenSeleccionado(ml)}
        maxMl={MAX_REGADO_ML}
        onConfirmar={() => void confirmarRegar()}
        deshabilitado={!online}
      />

      <Confirmar
        visible={confirmarParada}
        titulo="Parada de Emergencia"
        descripcion="Pondrá todos los pines GPIO en estado bajo (bomba, ventilador, LED y válvula) y pausará el control automático. ¿Continuar?"
        textoConfirmar="Parar todo"
        peligroso
        onCancelar={() => setConfirmarParada(false)}
        onConfirmar={() => {
          setConfirmarParada(false);
          void actuador.mutateAsync({ tipo: 'emergencia' }).then(() => hapticoExito());
        }}
      />
    </View>
  );
}

/** Modal de "Regar ahora": presets en mL o por segundos, con límite seguro. */
function ModalRegar({
  visible,
  cerrar,
  planta,
  seleccion,
  onSelect,
  maxMl,
  onConfirmar,
  deshabilitado,
}: {
  visible: boolean;
  cerrar: () => void;
  planta: string;
  sugerido: number;
  seleccion: number;
  onSelect: (ml: number) => void;
  maxMl: number;
  onConfirmar: () => void;
  deshabilitado: boolean;
}) {
  const [modoSegundos, setModoSegundos] = useState(false);
  const [segundos, setSegundos] = useState<6 | 10 | 20>(10);
  const caudalMLs = 18; // 1.1 L/min ≈ 18 mL/s
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={cerrar}>
      <View className="flex-1 items-center justify-center bg-black/50 px-4">
        <View className="w-full max-w-[340px] rounded-2xl bg-surface-container-lowest p-4">
          <Text className="text-title-md text-on-surface">Regar ahora · {planta}</Text>
          <Text className="mt-1 text-body-sm text-on-surface-variant">
            Límite de seguridad: máx. {maxMl} mL ({Math.round(maxMl / caudalMLs)} s) por riego manual.
          </Text>

          {/* Segmented: mL / segundos */}
          <View className="mt-3 flex-row rounded-xl bg-surface-container-low p-1">
            {(['ml', 'seg'] as const).map((modo) => (
              <Pressable
                key={modo}
                onPress={() => {
                  hapticoToque();
                  setModoSegundos(modo === 'seg');
                }}
                className={`flex-1 items-center rounded-lg py-2 ${((modo === 'seg') === modoSegundos) ? 'bg-surface-container-lowest' : ''}`}
                accessibilityRole="button"
              >
                <Text className={`text-label-lg font-semibold ${((modo === 'seg') === modoSegundos) ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {modo === 'ml' ? 'Mililitros' : 'Segundos'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="mt-2 flex-row gap-2">
            {(modoSegundos ? [6, 10, 20] : PRESETS_ML).map((valor) => {
              const activo = modoSegundos ? segundos === valor : seleccion === valor;
              return (
                <Pressable
                  key={valor}
                  onPress={() => {
                    hapticoToque();
                    if (modoSegundos) setSegundos(valor as 6 | 10 | 20);
                    else onSelect(valor);
                  }}
                  className={`flex-1 items-center rounded-xl py-2.5 ${activo ? 'bg-primary' : 'bg-surface-container-low'}`}
                  accessibilityRole="button"
                >
                  <Text className={`text-label-lg font-semibold ${activo ? 'text-on-primary' : 'text-on-surface'}`}>
                    {modoSegundos ? `${valor} s` : `${valor} mL`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mt-2 text-[11px] text-on-surface-variant">
            {modoSegundos
              ? `≈ ${segundos * caudalMLs} mL (${segundos} s a ${caudalMLs} mL/s)`
              : `≈ ${Math.round(seleccion / caudalMLs)} s de bomba`}
          </Text>

          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={cerrar}
              className="min-h-[48px] flex-1 items-center justify-center rounded-xl bg-surface-container"
              accessibilityRole="button"
            >
              <Text className="text-label-lg font-semibold text-on-surface">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirmar}
              disabled={deshabilitado}
              className={`min-h-[48px] flex-1 items-center justify-center rounded-xl bg-primary ${deshabilitado ? 'opacity-50' : ''}`}
              accessibilityRole="button"
            >
              <Text className="text-label-lg font-semibold text-on-primary">
                {deshabilitado ? 'RPi Offline' : 'Confirmar riego'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
