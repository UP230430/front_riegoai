# 🌱 RiegoSmart IA · Invernadero Inteligente

App móvil **Expo (React Native + TypeScript)** para monitorear y controlar un invernadero con riego automático: telemetría en vivo, diagnóstico de salud por IA, cámara con identificación de plantas, reglas de automatización SI/ENTONCES, timeline con exportación CSV y notificaciones locales.

**UI 100% en español · datos 100% simulados (mock)** detrás de una capa de servicios fácil de reemplazar.

---

## 🚀 Instalación y arranque

```bash
npm install
npx expo start        # escanea el QR con Expo Go (Android/iOS)
```

Con dispositivo/emulador:

```bash
npx expo start --android   # o --ios
```

Verificaciones de calidad:

```bash
npx tsc --noEmit      # typecheck estricto
npx expo lint         # ESLint
npx expo-doctor       # diagnóstico de dependencias
npx expo export       # bundle de producción (smoke test)
```

---

## 👥 Usuarios demo

| Rol | Correo | Contraseña |
|---|---|---|
| `admin` | admin@demo.com | demo123 |
| `operador` | operador@demo.com | demo123 |

- **Operador**: ve estado, histórico, cámara, riego manual, identifica plantas y consulta reglas en **solo lectura**.
- **Admin**: además crea/edita reglas, edita umbrales, parada de emergencia y **gestión de usuarios** (`/admin/usuarios`).
- Lo que no corresponde al rol se deshabilita con candado 🔒 y una explicación.
- La sesión persiste con `expo-secure-store`.

Tip: entra con más de un dispositivo (o reinicia cambiando de usuario) para ver los dos roles.

---

## 📁 Estructura

```
src/
  app/               Pantallas (Expo Router)
    (auth)/login.tsx
    (tabs)/index.tsx        Inicio (telemetría y control)
    (tabs)/timeline.tsx     Historial y alertas
    (tabs)/camara.tsx       En vivo + Identificar planta
    (tabs)/reglas.tsx       Reglas de automatización
    planta/[id].tsx         Detalle con gráficas
    vivero-mapa.tsx         Mapa de viveros
    admin/usuarios.tsx      Gestión de usuarios (admin)
    perfil.tsx / notificaciones.tsx
  services/          ⭐ La UI SOLO habla con estas funciones
    bd.ts              Estado en memoria espejado en AsyncStorage
    authService.ts / telemetriaService.ts / reglasService.ts /
    plantasService.ts / timelineService.ts / escaneosService.ts /
    viverosService.ts / usuariosService.ts / notificacionesService.ts
  mocks/             Datos semilla + simulador en vivo (ticking SGD cada 2 s)
  components/        Card, Chip, Header, RuleCard, Graficas (SVG), Mapa…
  hooks/ store/ theme/ types/ utils/
```

### 🔄 Cómo reemplazar el mock por una API real

Todo el negocio pasa por `src/services/*`. Por ejemplo, para conectar el backend:

1. Crea `telemetriaServiceReal.ts` con la misma **firma de funciones** que `telemetriaService.ts` (público en `src/hooks/useTelemetria.ts`).
2. Cambia el `import * as telemetriaService from '@/services/telemetriaService'` → `Real` (conviene un único index re-exportado para tocar un solo archivo).
3. Los tipos están en `src/types/index.ts`: mantén esos contratos.

No toques los componentes: nada de la UI conoce AsyncStorage, `Math.random()` ni el simulador.

---

## ✨ Funciones principales

- **Inicio**: carrusel de cultivos, diagnóstico "Azure AI" con % de vigor, métricas en vivo, matrices RPi GPIO, botón **Regar ahora** (mL o segundos, con límite de seguridad), ventilador, nivel de depósito y **parada de emergencia** (admin).
- **Timeline**: riegos/alertas/clima/inspecciones con filtros, scroll infinito, pull-to-refresh y **exportación CSV**.
- **Cámara**: modo "En vivo" (LiveFeed refresco cada 2 s, listo para stream real) y "Identificar" (foto → análisis → especie, confianza y salud; historial). "Dónde conseguirla" abre el mapa.
- **Reglas** SI/ENTONCES con switch, prioridad, "Probar ahora", builder de 4 pasos y umbrales (solo admin). Incluye las reglas KPI: regar < 35% → 60%, ventilador ≥ 30 °C → OFF ≤ 28 °C, bloqueo de bomba por depósito < 10%, máx. 10 s y espera mínima entre riegos.
- **Simulador vivo**: cada 2 s varía sensores y de vez en cuando dispara riegos y alertas (con notificaciones locales).
- **Modo offline**: alterna RPi Online/Offline desde **Perfil**. La BD y sesión persisten en AsyncStorage/SecureStore.

---

## ⚠️ Módulos nativos y Expo Go

Todo funciona en **Expo Go** salvo `react-native-maps` en **web** (ahí se muestra una vista demo; en Android/iOS nativo sí funciona). No obligatoria para la demo: si algún día se usa un SDK nativo fuera de Expo Go, documentarlo con `npx expo run:android|ios` o `eas build --profile development`.

Notificaciones: en Android 13+ se pide permiso de primer uso y se crea un canal (`riegosmart-demo`); en Expo Go funcionan las locales.

---

## 📐 Convenciones

- Tokens de diseño de `design/…/DESIGN.md` centralizados en `tailwind.config.js` y `src/theme/tokens.ts` (primary `#2E7D32`, Inter 400/500/600/700, radios 16px, pill 9999px).
- NativeWind v4 · nombres de clase en español (`bg-surface-container`, `text-on-primary`, `p-space-md`).
- TypeScript estricto, sin `any`; componentes puros y reutilizables; commits Conventional Commits.
