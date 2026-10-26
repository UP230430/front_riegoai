import * as ExpoHaptics from 'expo-haptics';

/** Hápticos tolerantes: en Expo Go web o sin soporte no rompen la demo. */
export function hapticoToque(): void {
  ExpoHaptics.selectionAsync().catch(() => undefined);
}

export function hapticoExito(): void {
  ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success).catch(() => undefined);
}

export function hapticoAviso(): void {
  ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning).catch(() => undefined);
}

export function hapticoError(): void {
  ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error).catch(() => undefined);
}
