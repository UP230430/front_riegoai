import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { BotonPill } from '@/components/ui/Botones';
import { ActuadorRow, FilaAccion } from '@/components/ui/ActuadorRow';
import { MetricCard, BadgeMetrica } from '@/components/ui/MetricCard';
import { MatrizGpio } from '@/components/ui/MatrizGpio';
import { TarjetaResumen } from '@/components/ui/TarjetaResumen';
import { BannerOffline, Vacio } from '@/components/ui/Estados';
import { AnilloProgreso, BarraNivel } from '@/components/Graficas';
import { Confirmar } from '@/components/Confirmar';
import { ModalRegar } from '@/components/ModalRegar';
import {
  useActuador,
  useDispositivo,
  useLecturas,
  useRegarAhora,
  usePlantas,
  usePrediccion,
  useSimuladorInvalidador,
} from '@/hooks/useTelemetria';
import { useSesion } from '@/store/useSesionStore';
import { MAX_REGADO_ML, telemetriaService } from '@/services';
import { colores } from '@/theme/tokens';
import { proximoRelativo, relativo } from '@/utils/formato';
import { hapticoAviso, hapticoExito, hapticoError, hapticoToque } from '@/utils/haptico';

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

  async function confirmarRegar(volumenMl = volumenSeleccionado) {
    if (!plantaActual) return;
    setModalRegar(false);
    try {
      await regar.mutateAsync({
        plantaId: plantaActual.id,
        volumenMl,
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
              <MaterialIcons name="sensors" size={15} color={colores.primary} />
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
              <MaterialIcons name="add" size={18} color={colores.onSurface} />
              <Text className="text-label-md font-medium text-on-surface">Añadir</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Banner diagnóstico IA */}
        <View className="px-gutter-mobile pt-2">
          <Card className="flex-row items-center justify-between">
            <View className="min-w-0 flex-row items-center gap-2" style={{ flex: 1 }}>
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-container">
                <MaterialIcons name="psychology" size={22} color={colores.onPrimaryContainer} />
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
              <MaterialIcons name="chevron-right" size={16} color={colores.primary} />
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
          <MetricCard
            icono="water-drop"
            colorIcono={colores.onSecondaryContainer}
            fondoIcono="bg-secondary-container"
            etiqueta="Humedad Sustrato · Sonda A0"
            valor={`${humedad}%`}
            detalle={{
              texto: `Óptimo (${plantaActual?.humedadOptima[0]}-${plantaActual?.humedadOptima[1]}%)`,
              clase: 'text-primary',
            }}
            derecha={<AnilloProgreso pct={humedad} />}
            fila={
              <FilaAccion
                icono={bombaOn ? 'water-pump' : 'play-circle'}
                colorIcono={colores.secondary}
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
            }
          />

          {/* 2 · Temperatura + ventilador */}
          <MetricCard
            icono="device-thermostat"
            colorIcono={colores.onTertiaryContainer}
            fondoIcono="bg-tertiary-container"
            etiqueta="Temperatura Ambiente · DHT22"
            valor={`${lecturas.data?.temperatura ?? '—'} °C`}
            detalle={{
              texto: (lecturas.data?.temperatura ?? 0) >= 30 ? 'Calor' : 'Templado',
              clase: 'text-tertiary',
            }}
            derecha={
              ventiladorOn ? (
                <BadgeMetrica texto="Fan Activo" fondo="bg-tertiary-container" color="text-on-tertiary-container" />
              ) : undefined
            }
            fila={
              <ActuadorRow
                icono="fan"
                colorIcono={colores.tertiary}
                titulo="Ventilador Extractor (GPIO 27)"
                subtitulo={ventiladorOn ? 'PWM 50% · En marcha' : 'Apagado'}
                activo={ventiladorOn}
                permitido={online}
                motivoBloqueo="RPi Offline: no se puede accionar el extractor"
                onChange={(v) => void actuador.mutateAsync({ tipo: 'ventilador', valor: v }).then(() => hapticoExito())}
              />
            }
          />

          {/* 3 · Luz + LED grow */}
          <MetricCard
            icono="wb-sunny"
            colorIcono={colores.onPrimaryContainer}
            fondoIcono="bg-primary-container"
            etiqueta="Radiación Lumínica · BH1750"
            valor={`${(lecturas.data?.luz ?? 0).toLocaleString('es-MX')} lx`}
            detalle={{ texto: 'Fotosíntesis Alta', clase: 'text-primary' }}
            derecha={
              <BadgeMetrica
                texto={ledsOn ? 'LED On' : 'LED Off'}
                fondo="bg-primary-container"
                color="text-on-primary-container"
              />
            }
            fila={
              <ActuadorRow
                icono="lightbulb"
                colorIcono={colores.primary}
                titulo="Luminaria Espectro Completo (GPIO 22)"
                subtitulo={ledsOn ? 'Atenuación PWM 80%' : 'Apagada'}
                activo={ledsOn}
                permitido={online}
                motivoBloqueo="RPi Offline: no se puede accionar la luminaria"
                onChange={(v) => void actuador.mutateAsync({ tipo: 'leds', valor: v })}
              />
            }
          />

          {/* Fila 2 col: depósito + programa */}
          <View className="flex-row gap-2">
            <TarjetaResumen
              icono="inventory-2"
              colorIcono={colores.onSecondaryContainer}
              fondoIcono="bg-secondary-container"
              etiquetaDerecha={{ texto: 'Ultrasonido', clase: 'text-on-surface-variant' }}
            >
              <View>
                <Text className="text-label-sm text-on-surface-variant">Depósito Principal</Text>
                <Text className="text-title-lg font-bold text-on-surface">
                  {nivelDeposito}% <Text className="text-body-sm font-normal text-on-surface-variant">/ 5.0 L</Text>
                </Text>
              </View>
              <BarraNivel pct={nivelDeposito} color={nivelDeposito < 15 ? colores.error : nivelDeposito < 30 ? colores.tertiary : colores.secondary} />
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
            </TarjetaResumen>

            <TarjetaResumen
              icono="schedule"
              colorIcono={colores.onPrimaryContainer}
              fondoIcono="bg-primary-container"
              etiquetaDerecha={{ texto: 'Programado', clase: 'font-semibold text-primary' }}
            >
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
            </TarjetaResumen>
          </View>
        </View>

        {/* Matriz RPi GPIO */}
        <View className="px-gutter-mobile pt-3">
          <MatrizGpio
            online={online}
            esAdmin={esAdmin}
            dispositivo={dispositivo.data}
            onActuar={(tipo, valor) => {
              void actuador.mutateAsync({ tipo, valor });
            }}
            onAlternarAuto={() =>
              void actuador
                .mutateAsync({ tipo: 'modoAuto', valor: !(dispositivo.data?.modoAuto ?? true) })
                .then(() => hapticoExito())
            }
            onEmergencia={() => {
              hapticoAviso();
              setConfirmarParada(true);
            }}
          />
        </View>
      </ScrollView>

      {/* Modal de regado: mL o segundos, límite seguro */}
      <ModalRegar
        visible={modalRegar}
        cerrar={() => setModalRegar(false)}
        planta={plantaActual?.nombre ?? 'Planta'}
        seleccion={volumenSeleccionado}
        onSelect={(ml) => setVolumenSeleccionado(ml)}
        maxMl={MAX_REGADO_ML}
        onConfirmar={(ml) => void confirmarRegar(ml)}
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
