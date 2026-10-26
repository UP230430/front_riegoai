import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { hapticoToque } from '@/utils/haptico';

const PRESETS_ML = [120, 180, 250];

/** Modal de "Regar ahora": presets en mL o por segundos, con límite seguro. */
export function ModalRegar({
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
  seleccion: number;
  onSelect: (ml: number) => void;
  maxMl: number;
  onConfirmar: (ml: number) => void;
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
              onPress={() => onConfirmar(modoSegundos ? segundos * caudalMLs : seleccion)}
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
