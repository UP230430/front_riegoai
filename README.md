# 🌱 RiegoSmart IA · Invernadero Inteligente

App móvil **Expo (React Native + TypeScript)** para monitorear y controlar un invernadero con riego automático: telemetría en vivo, diagnóstico de salud por IA, cámara con identificación de plantas, reglas de automatización SI/ENTONCES, timeline con exportación CSV y notificaciones locales.

**UI 100% en español · datos 100% simulados (mock)** detrás de una capa de servicios fácil de reemplazar.

---

## 🚀 Instalación y arranque

```bash
npm install
npx expo start        # escanea el QR con Expo Go (Android/iOS)
```

Verificaciones de calidad:

```bash
npx tsc --noEmit      # typecheck estricto
npx expo lint         # ESLint
npx expo-doctor       # diagnóstico de dependencias
```

---

## 👥 Usuarios demo

| Rol | Correo | Contraseña |
|---|---|---|
| `admin` | admin@demo.com | demo123 |
| `operador` | operador@demo.com | demo123 |

- **Operador**: consulta en **solo lectura** (estado, histórico, cámara, reglas) y puede regar manualmente.
- **Admin**: además crea/edita reglas, umbrales, parada de emergencia y **gestión de usuarios**.
- Lo que no corresponde al rol se deshabilita con candado 🔒. La sesión persiste con `expo-secure-store`.

---

## 📐 Arquitectura (SOLID)

Cada capa tiene **una sola responsabilidad** y depende de abstracciones, no de detalles:

```
src/
  app/                  Pantallas (Expo Router): ORQUESTAN, no dibujan ni calculan
    (tabs)/index.tsx      Inicio: usa MetricCard / MatrizGpio / ModalRegar
    (tabs)/{timeline,camara,reglas}.tsx · planta/[id] · vivero-mapa · admin/usuarios
  components/
    ui/                 Piezas presentationales puras (Card, MetricCard, MatrizGpio,
                        ActuadorRow, Estados, Select, Chip, Botones…) — reciben datos
                        y callbacks, nada de servicios
    ModalRegar · RuleCard · TimelineItem · Graficas (SVG) · LiveFeed · mapa/
  hooks/useTelemetria.ts  Único acoplamiento UI↔datos: queries/mutations de React Query
  services/  ⭐           La UI SOLO importa de '@/services' (index re-exporta)
    index.ts             clap de dominio; `bd.ts` (infraestructura) NO se re-exporta
  mocks/                 Datos semilla + simulador en vivo (cada 2 s)
  theme/tokens.ts        Única fuente de color: cero hex en componentes
  types/                 Contratos compartidos (index.ts) + css.d.ts
  utils/                 formato / csv / haptico
```

- **SRP**: la lógica de negocio vive en `services/`; las pantallas solo coordinan hooks y componentes; los componentes `ui/` solo presentan.
- **Abierto/cerrado**: `useTelemetria → ACCIONES` mapea cada tipo de actuación a su función de servicio; agregar un actuador nuevo es una entrada del mapa, no un `switch` en el componente.
- **Inversión de dependencias**: la UI desconoce AsyncStorage, `Math.random()` y el simulador — todo el negocio pasa por los `*Service`.

### 🔄 Cómo reemplazar el mock por una API real

1. Crea `telemetriaServiceReal.ts` con la misma **firma** que `telemetriaService.ts`.
2. En `src/services/index.ts`, cambia el re-export → tocas **un solo archivo**.
3. Mantén los contratos de `src/types/index.ts`. Los componentes ni se enteran.

---

## ✨ Funciones principales

- **Inicio**: carrusel de cultivos, diagnóstico "Azure AI" con % de vigor, métricas en vivo (tarjetas `MetricCard`), matriz RPi GPIO (`MatrizGpio`), **Regar ahora** (mL o segundos, con límite de seguridad), ventilador, LED, depósito y **parada de emergencia** (admin).
- **Timeline**: riegos/alertas/clima/inspecciones con filtros, scroll infinito, pull-to-refresh y **exportación CSV**.
- **Cámara**: modo "En vivo" (LiveFeed cada 2 s, listo para stream real) y "Identificar" (foto → especie, confianza y salud; historial). "Dónde conseguirla" abre el mapa.
- **Reglas** SI/ENTONCES con switch, prioridad, "Probar ahora", builder de 4 pasos y umbrales (solo admin). Incluye las reglas KPI: regar < 35% → 60%, ventilador ≥ 30 °C → OFF ≤ 28 °C, bloqueo de bomba por depósito < 10%, máx. 600 mL y espera mínima entre riegos.
- **Simulador vivo**: cada 2 s varía sensores y dispara riegos y alertas (con notificaciones locales).
- **Modo offline**: alterna RPi Online/Offline desde **Perfil**. La BD y sesión persisten en AsyncStorage/SecureStore.

---

## ⚠️ Módulos nativos y Expo Go

Todo funciona en **Expo Go** salvo `react-native-maps` en **web** (ahí se muestra una vista demo; en Android/iOS nativo sí funciona). Notificaciones: en Android 13+ se pide permiso de primer uso y se crea un canal (`riegosmart-demo`).

---

## 📐 Convenciones

- Colores centralizados en `src/theme/tokens.ts` y `tailwind.config.js` (primary `#2E7D32`). **Prohibido un hex fuera de ambos.**
- NativeWind v4 · nombres de clase en español (`bg-surface-container`, `text-on-primary`).
- TypeScript estricto, sin `any`; commits Conventional Commits.
