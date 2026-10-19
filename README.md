# kyc-merchant-demo

Tienda de ejemplo ("Protecta Seguros") que muestra cómo se ve el KYC embebido de Conekta dentro del checkout de un merchant. Al abrirla crea un flujo en staging, carga el loader `ConektaKYC` de ct-kyc-fe y lo monta en un iframe. Cuando el comprador avanza (paso 2 o más), el selector de métodos de pago se colapsa.

Stack: Vite, React 18, TypeScript, Mantine 8 e íconos Tabler (`react-icons/tb`). Solo escritorio.

## Copiar a StackBlitz

1. En tu proyecto de StackBlitz (plantilla Vite + React + TS), copia todo este contenido: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.env.example`, `.gitignore`, `server/` y `src/`. No copies `node_modules` ni `dist`. Borra los archivos de la plantilla que no estén aquí (por ejemplo `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`, `src/App.css`, `src/index.css` y `src/assets/`) para que no choquen con esta configuración.
2. Crea un archivo `.env` a partir de `.env.example` y completa los valores.
3. Corre `npm install` y `npm run dev` (StackBlitz lo hace solo).

## Publicar desde tu máquina (Cloudflare quick tunnel)

StackBlitz no sirve para probar el iframe real: su vista previa está aislada (COEP) y el navegador bloquea el iframe de `kyc.stg.conekta.io`. La opción más simple, gratis y sin cuenta, es correr la tienda en local y exponerla con un túnel rápido de Cloudflare:

```bash
brew install cloudflared                          # una vez; no pide cuenta
cp .env.example .env                              # y completa los valores
npm install
npm run dev:tunnel                                # Vite en http://localhost:5173, aceptando *.trycloudflare.com
cloudflared tunnel --url http://localhost:5173    # en otra terminal
```

`cloudflared` imprime una URL `https://<algo>.trycloudflare.com` para abrir o compartir. Solo funciona mientras ambos procesos estén corriendo, y la URL cambia cada vez. La llave privada se queda en tu máquina. `npm run dev` normal no acepta ese dominio.

## Variables (`.env`)

| Variable | Qué es |
| --- | --- |
| `CONEKTA_PRIVATE_KEY` | Llave privada de staging. Sin prefijo `VITE_`: solo la lee el middleware de Vite y no entra al bundle del navegador. |
| `VITE_CONEKTA_PUBLIC_KEY` | Llave pública. El loader solo valida el formato `^key_[A-Za-z0-9_]{8,64}$`. |
| `VITE_KYC_BASE_URL` | Origen de ct-kyc-fe. Por defecto `https://kyc.stg.conekta.io`. |

Nunca subas `.env` a un repositorio.

## Uso

- Sin `?flow=` la tienda crea un flujo (muestra un skeleton) y guarda su ID en `?flow=`. Al recargar lo reusa.
- "Nuevo flujo" (arriba del checkout, a la derecha) borra `?flow=` y crea otro.
- `?debug=true` muestra el panel plegable "Eventos del iframe" con cada callback (`onReady`, `onStepChange`, `onComplete`, `onError`), su hora y su payload.
- `?flow=<uuid>` permite saltarse la creación y usar un flujo que ya tengas.
- Elegir "Tarjeta" oculta el iframe sin destruirlo; al volver a Domiciliación sigue en el mismo paso.

## Advertencias

- **Crear un flujo da de alta un customer real en staging** (con el nombre y email del body en `server/createFlow.ts`), y Conekta puede enviar un correo a ese email. Reusa `?flow=` en lugar de recargar sin él.
- **La llave privada queda visible para quien abra el proyecto**: en StackBlitz el servidor de Vite corre dentro del navegador, así que `.env` y sus requests salientes son visibles para quien tenga acceso al proyecto. Usa una llave de staging y no compartas el proyecto públicamente.
- **El endpoint `/api/create-flow` solo existe en `vite dev`** (es un middleware de `configureServer`). No funciona con `vite build`/`vite preview`.
- **Contra staging** hace falta que la rama de ct-kyc-fe con el loader (`/v1.0/js/conekta-kyc.min.js`) y el modo embebido esté desplegada en `https://kyc.stg.conekta.io`.

## Apuntar a ct-kyc-fe local

1. Levanta ct-kyc-fe en `https://localhost:9092`, con `KYC_MOCK_ACCOUNT_STEP=true` si quieres ver el paso "Cuenta".
2. Abre `https://localhost:9092` en una pestaña y acepta el certificado autofirmado (si no, el navegador bloquea el script).
3. En `.env` pon `VITE_KYC_BASE_URL=https://localhost:9092` y reinicia `npm run dev`.

Nota: StackBlitz no puede alcanzar `localhost` de tu máquina; esta opción es para correr la tienda localmente (`npm i && npm run dev`).

## Pruebas

`npm test` corre los tests del middleware (`server/createFlow.ts` y el handler de `server/createFlowPlugin.ts`) con `fetch` simulado; no tocan la API real.

## Sobre frontino-ui

El ticket pedía `@conekta/frontino-ui` 3.5.3 desde npm público, pero ese paquete se publica en GitHub Packages (registro privado, requiere token). Para que instale en StackBlitz sin registros privados, `src/theme.ts` replica sobre Mantine 8 los tokens de `kycTheme` de ct-kyc-fe (frontino 3.5.3 con su `neutral`): colores `primary` y `neutral`, espaciado, radios, tamaños de fuente, alturas de línea, encabezados, breakpoints, sombras y los defaults de `Badge` y `ThemeIcon`.
