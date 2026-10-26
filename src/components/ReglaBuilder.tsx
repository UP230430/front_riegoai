import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Regla } from '@/types';
import { hapticoToque } from '@/utils/haptico';
import { Boton } from '@/components/ui/Botones';

const SENSORES: { id: Regla['si']['sensor']; etiqueta: string }[] = [
  { id: 'humedadSuelo', etiqueta: 'Humedad sustrato (%)' },
  { id: 'temperatura', etiqueta: 'Temperatura (°C)' },
  { id: 'luz', etiqueta: 'Luz (lx)' },
  { id: 'nivelDeposito', etiqueta: 'Nivel tanque (%)' },
];
const OPERADORES: { id: Regla['si']['operador']; etiqueta: string }[] = [
  { id: '<', etiqueta: 'menor que <' },
  { id: '>=', etiqueta: 'mayor o igual ≥' },
  { id: '<=', etiqueta: 'menor o igual ≤' },
];
const ACTUADORES: { id: Regla['entonces']['actuador']; etiqueta: string }[] = [
  { id: 'bomba', etiqueta: 'Bomba GPIO 17' },
  { id: 'ventilador', etiqueta: 'Ventilador GPIO 27' },
];
const PRIORIDADES: { id: Regla['prioridad']; etiqueta: string; color: string }[] = [
  { id: 'alta', etiqueta: 'Alta', color: 'bg-error-container text-on-error-container' },
  { id: 'media', etiqueta: 'Media', color: 'bg-surface-container-high text-on-surface' },
  { id: 'baja', etiqueta: 'Baja', color: 'bg-surface-container text-on-surface-variant' },
];

function ParaConSlider({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-body-md text-on-surface">Dosis por ejecución</Text>
      <TextInput
        value={String(valor)}
        onChangeText={(t) => {
          const n = parseInt(t, 10);
          if (!Number.isNaN(n)) onChange(Math.min(1000, Math.max(20, n)));
        }}
        keyboardType="number-pad"
        className="w-20 rounded-lg border border-outline-variant px-2 py-1 text-body-md text-on-surface"
        testID="regla-dosis"
      />
    </View>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onGuardar: (datos: Omit<Regla, 'id' | 'categoria' | 'bloqueadaPorSeguridad'>, id?: string) => void;
  regla?: Regla;
}

/** Modal de 4 pasos: sensor, condición, actuador y duración. Solo admin. */
export function ReglaBuilder({ visible, onClose, onGuardar, regla }: Props) {
  const [paso, setPaso] = useState(1);
  const [sensor, setSensor] = useState<Regla['si']['sensor']>(regla?.si.sensor ?? 'humedadSuelo');
  const [operador, setOperador] = useState<Regla['si']['operador']>(regla?.si.operador ?? '<');
  const [umbral, setUmbral] = useState<string>(String(regla?.si.umbral ?? 35));
  const [actuador, setActuador] = useState<Regla['entonces']['actuador']>(regla?.entonces.actuador ?? 'bomba');
  const [dosis, setDosis] = useState<number>(regla?.entonces.volumenMl ?? 180);
  const reset = () => {
    setPaso(1);
    if (!regla) {
      setSensor('humedadSuelo');
      setOperador('<');
      setUmbral('35');
      setActuador('bomba');
      setDosis(180);
    }
  };
  const guardar = () => {
    hapticoToque();
    const valorUmbral = Number(umbral) || 0;
    onGuardar({
      nombre: regla?.nombre ?? `Regla ${SENSORES.find((s) => s.id === sensor)?.etiqueta}`,
      activa: regla?.activa ?? true,
      prioridad: regla?.prioridad ?? 'media',
      ultimaEjecucion: regla?.ultimaEjecucion,
      si: { sensor, operador, umbral: umbral || String(valorUmbral) },
      entonces: {
        actuador,
        accion: actuador === 'bomba' ? 'regar_volumen' : 'encender',
        volumenMl: actuador === 'bomba' ? dosis : undefined,
      },
    });
    reset();
  };

  const tituloPaso = ['Disparador', 'Condición', 'Acción', 'Programación'][paso - 1];
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-[rgba(0,0,0,0.5)]">
        <View className="rounded-t-3xl bg-surface-bright px-space-md pb-xl pt-3">
          <View className="flex-row items-center justify-between pb-2">
            <Text className="text-title-md text-on-surface">{regla ? 'Modificar' : 'Crear'} regla inteligente</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar bot" className="h-10 w-10 items-center justify-center">
              <MaterialIcons name="close" size={24} color="#555555" />
            </Pressable>
          </View>
          <Text className="pb-1 text-[11px] text-primary">
            Configurador · Paso {paso}/4 · {tituloPaso}
          </Text>
          <View className="pt-2">
            {paso === 1 && (
              <View className="gap-2">
                {SENSORES.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      hapticoToque();
                      setSensor(s.id);
                    }}
                    className={`min-h-[48px] flex-row items-center justify-between rounded-xl px-4 py-3 ${sensor === s.id ? 'bg-primary-container' : 'bg-surface-container-low'}`}
                    accessibilityRole="radio"
                    accessibilityLabel={`Disparador: ${s.etiqueta}`}
                  >
                    <Text className="text-body-md text-on-surface">{s.etiqueta}</Text>
                    {sensor === s.id && <MaterialIcons name="check" size={22} color="#1B5E20" />}
                  </Pressable>
                ))}
              </View>
            )}
            {paso === 2 && (
              <View className="gap-3">
                <View className="flex-row flex-wrap gap-2">
                  {OPERADORES.map((o) => (
                    <Pressable
                      key={o.id}
                      onPress={() => {
                        hapticoToque();
                        setOperador(o.id);
                      }}
                      className={`min-h-[44px] rounded-full px-4 py-2 ${operador === o.id ? 'bg-primary' : 'bg-surface-container'}`}
                        accessibilityRole="radio"
                      accessibilityLabel={`Operador: ${o.etiqueta}`}
                    >
                      <Text className={`text-label-md ${operador === o.id ? 'text-on-primary' : 'text-on-surface'}`}>{o.etiqueta}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text className="text-body-sm text-on-surface-variant">Valor objetivo</Text>
                <TextInput
                  value={umbral}
                  onChangeText={setUmbral}
                  keyboardType="decimal-pad"
                  className="rounded-xl border border-outline-variant px-4 py-3 text-body-lg text-on-surface"
                  testID="regla-umbral"
                />
              </View>
            )}
            {paso === 3 && (
              <View className="gap-2">
                {ACTUADORES.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => {
                      hapticoToque();
                      setActuador(a.id);
                    }}
                    className={`min-h-[48px] flex-row items-center justify-between rounded-xl px-4 py-3 ${actuador === a.id ? 'bg-primary-container' : 'bg-surface-container-low'}`}
                      accessibilityRole="radio"
                    accessibilityLabel={`Actuador: ${a.etiqueta}`}
                  >
                    <Text className="text-body-md text-on-surface">{a.etiqueta}</Text>
                    {actuador === a.id && <MaterialIcons name="check" size={22} color="#1B5E20" />}
                  </Pressable>
                ))}
                {actuador === 'bomba' && (
                  <View className="pt-2">
                    <ParaConSlider valor={dosis} onChange={setDosis} />
                  </View>
                )}
              </View>
            )}
            {paso === 4 && (
              <View className="flex-col gap-3">
                <View className="flex-row flex-wrap gap-2">
                  {PRIORIDADES.map((p) => (
                    <Text key={p.id} className={`rounded-full px-3 py-1 ${p.color} text-label-md`}>
                      {p.etiqueta}
                    </Text>
                  ))}
                </View>
                <Text className="text-body-sm text-on-surface-variant">
                  La prioridad define el orden de evaluación en el simulador. “Guardar” queda inmediatamente activa.
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row justify-between pt-4">
            <Boton
              variante="secundario"
              texto={paso === 1 ? 'Cancelar' : 'Atrás'}
              onPress={() => {
                if (paso === 1) onClose();
                else setPaso(paso - 1);
              }}
              className="flex-1"
            />
            {paso < 4 ? (
              <Boton texto="Siguiente" onPress={() => setPaso(paso + 1)} className="flex-1" />
            ) : (
              <Boton texto={regla ? 'Actualizar' : 'Guardar'} onPress={guardar} className="flex-1" />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
