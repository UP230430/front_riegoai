import { MaterialIcons } from '@expo/vector-icons';
import { Pressable, Switch, Text, View } from 'react-native';
import type { CategoriaRegla, Regla } from '@/types';
import { colores } from '@/theme/tokens';
import { relativo } from '@/utils/formato';
import { hapticoToque } from '@/utils/haptico';

const ICONO_CATEGORIA: Record<CategoriaRegla, string> = {
  riego: 'water-drop',
  clima: 'device-thermostat',
  iluminacion: 'light-mode',
  seguridad: 'shield',
};

const FONDO_CATEGORIA: Record<CategoriaRegla, string> = {
  riego: 'bg-primary-container',
  clima: 'bg-tertiary-container',
  iluminacion: 'bg-secondary-container',
  seguridad: 'bg-error-container',
};

const COLOR_CATEGORIA: Record<CategoriaRegla, string> = {
  riego: colores.onPrimaryContainer,
  clima: colores.onTertiaryContainer,
  iluminacion: colores.onSecondaryContainer,
  seguridad: colores.onErrorContainer,
};

const TEXTO_PRIORIDAD: Record<Regla['prioridad'], string> = {
  alta: 'Prioridad Alta',
  media: 'Prioridad Media',
  baja: 'Prioridad Baja',
};

function descripcionSi(regla: Regla): string {
  const sensor = {
    humedadSuelo: 'Humedad sustrato',
    temperatura: 'Temperatura',
    luz: 'Luz solar',
    nivelDeposito: 'Nivel tanque',
    horario: 'Horario',
  }[regla.si.sensor];
  if (regla.si.sensor === 'horario') {
    return `${sensor} entre ${regla.si.umbral}`;
  }
  const op = { '<': '<', '>': '>', '<=': '≤', '>=': '≥', entre: 'entre' }[regla.si.operador];
  const unidad = { humedadSuelo: '%', temperatura: '°C', luz: ' lx', nivelDeposito: '%' }[regla.si.sensor] ?? '';
  const durante = regla.si.duranteMin ? ` durante ${regla.si.duranteMin} min` : '';
  return `${sensor} ${op} ${regla.si.umbral}${unidad}${durante}`;
}

function descripcionEntonces(regla: Regla): string {
  const actuador = {
    bomba: 'Bomba GPIO 17',
    ventilador: 'Ventilador GPIO 27',
    leds: 'Luces LED GPIO 22',
    valvulaLlenado: 'Válvula GPIO 24',
  }[regla.entonces.actuador];
  switch (regla.entonces.accion) {
    case 'regar_volumen':
      return `Activar ${actuador} (${regla.entonces.volumenMl ?? 180} mL${
        regla.entonces.hastaValor ? ` hasta ${regla.entonces.hastaValor}%` : ''
      })`;
    case 'encender':
      return `Encender ${actuador}`;
    case 'apagar':
      return `Apagar ${actuador}`;
    case 'bloquear':
      return `Bloquear ${actuador} y alertar al móvil`;
  }
}

interface Props {
  regla: Regla;
  esAdmin: boolean;
  onToggle: (activa: boolean) => void;
  onEditar: (regla: Regla) => void;
  onProbar: (regla: Regla) => void;
  onEliminar: (regla: Regla) => void;
}

/** Tarjeta de regla SI/ENTONCES con switch, prioridad y acciones admin. */
export function RuleCard({ regla, esAdmin, onToggle, onEditar, onProbar, onEliminar }: Props) {
  const editable = esAdmin && !regla.bloqueadaPorSeguridad;
  return (
    <View className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <View className={`h-9 w-9 items-center justify-center rounded-xl ${FONDO_CATEGORIA[regla.categoria]}`}>
            <MaterialIcons name={ICONO_CATEGORIA[regla.categoria] as never} size={20} color={COLOR_CATEGORIA[regla.categoria]} />
          </View>
          <View className="flex-col">
            <Text className="text-title-md text-on-surface">{regla.nombre}</Text>
            <View className="mt-0.5 flex-row items-center gap-2">
              <Text
                className={`rounded-full px-2 py-0.5 text-label-sm ${
                  regla.prioridad === 'alta'
                    ? 'bg-error-container text-on-error-container'
                    : regla.prioridad === 'media'
                      ? 'bg-surface-container-high text-on-surface'
                      : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {TEXTO_PRIORIDAD[regla.prioridad]}
              </Text>
              {regla.bloqueadaPorSeguridad && (
                <Text className="text-[11px] text-on-surface-variant">🔒 Regla de seguridad</Text>
              )}
            </View>
          </View>
        </View>
        <Switch
          value={regla.activa}
          onValueChange={(v) => {
            hapticoToque();
            onToggle(v);
          }}
          disabled={!editable}
          trackColor={{ false: colores.surfaceContainerHighest, true: colores.primary }}
          accessibilityLabel={`Regla ${regla.nombre}: ${regla.activa ? 'activa' : 'pausada'}${editable ? '' : ' (solo admin)'}`}
        />
      </View>

      {/* SI / ENTONCES */}
      <View className="mt-2 gap-1 rounded-xl bg-surface-container-low p-3">
        <View className="flex-row items-center gap-2">
          <Text className={`text-label-sm font-semibold uppercase tracking-wider ${regla.categoria === 'seguridad' ? 'text-error' : 'text-secondary'}`}>
            SI
          </Text>
          <Text className="text-body-sm text-on-surface">{descripcionSi(regla)}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-label-sm font-semibold uppercase tracking-wider text-primary">ENTONCES</Text>
          <Text className="text-body-sm font-medium text-on-surface">{descripcionEntonces(regla)}</Text>
        </View>
      </View>

      {/* Pie */}
      <View className="flex-row items-center justify-between pt-2">
        <View className="flex-row items-center gap-1">
          <MaterialIcons name="schedule" size={16} color={COLOR_CATEGORIA[regla.categoria]} />
          <Text className="text-label-md text-on-surface-variant">
            {regla.ultimaEjecucion ? `Último disparo: ${relativo(regla.ultimaEjecucion)}` : 'Sin disparos recientes'}
          </Text>
        </View>
        <View className="flex-row gap-2">
          {esAdmin && (
            <Pressable
              onPress={() => {
                hapticoToque();
                onEditar(regla);
              }}
              className="flex-row items-center gap-1 rounded-lg bg-surface-container px-3 py-1.5 min-h-[36px]"
              accessibilityRole="button"
              accessibilityLabel={`Modificar regla ${regla.nombre}`}
            >
              <MaterialIcons name="edit" size={16} color={colores.onSurface} />
              <Text className="text-label-md text-on-surface">{regla.bloqueadaPorSeguridad ? 'Ver' : 'Modificar'}</Text>
            </Pressable>
          )}
          {esAdmin && (
            <Pressable
              onPress={() => {
                hapticoToque();
                onProbar(regla);
              }}
              className="flex-row items-center gap-1 rounded-lg bg-secondary-container px-3 py-1.5 min-h-[36px]"
              accessibilityRole="button"
              accessibilityLabel={`Probar regla ${regla.nombre}`}
            >
              <MaterialIcons name="play-arrow" size={16} color={colores.onSecondaryContainer} />
              <Text className="text-label-md text-on-secondary-container">Probar ahora</Text>
            </Pressable>
          )}
          {esAdmin && !regla.bloqueadaPorSeguridad && (
            <Pressable
              onPress={() => onEliminar(regla)}
              className="items-center justify-center rounded-lg bg-error-container px-2.5 py-1.5 min-h-[36px]"
              accessibilityRole="button"
              accessibilityLabel={`Eliminar regla ${regla.nombre}`}
            >
              <MaterialIcons name="delete-outline" size={16} color={colores.onErrorContainer} />
            </Pressable>
          )}
        </View>
      </View>
      {!esAdmin && (
        <Text className="pt-1 text-[11px] text-on-surface-variant">
          🔒 Solo lectura: solicitar al administrador para editar reglas.
        </Text>
      )}
    </View>
  );
}
