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
| `CONEKTA_PRIVATE_KEY` | Llave privada de staging. Solo la lee el servidor y no entra al bundle del navegador. |
| `CONEKTA_PUBLIC_KEY` | Llave pública. El loader solo valida el formato `^key_[A-Za-z0-9_]{8,64}$`. |
| `KYC_BASE_URL` | Origen de ct-kyc-fe. Por defecto `https://kyc.stg.conekta.io`. |
| `CONEKTA_API_URL` | API donde se crea el customer. Por defecto `https://api.stg.conekta.io`. Debe ser el mismo ambiente que `KYC_BASE_URL`. |
| `PORT` | Solo para `npm start` y la imagen. Por defecto `3000`. |

Las mismas variables sirven para `npm run dev` (desde `.env`) y para la imagen (variables del pod). La llave pública y `KYC_BASE_URL` no van en el bundle: el navegador las lee de `/config.js` al cargar, así una misma imagen sirve en cualquier ambiente.

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
- **`/api/create-flow` y `/config.js` los sirve el servidor**: el middleware de Vite en `npm run dev` y `server/main.ts` en `npm start` y en la imagen. Un `dist/` servido por otro lado (por ejemplo `vite preview`) no los tiene.
- **En UAT el sitio es público**: cualquiera que abra `store-conekta-kyc.uat.conekta.com` crea un customer en staging con los datos de `server/createFlow.ts`.
- **Contra staging** hace falta que la rama de ct-kyc-fe con el loader (`/v1.0/js/conekta-kyc.min.js`) y el modo embebido esté desplegada en `https://kyc.stg.conekta.io`.

## Apuntar a ct-kyc-fe local

1. Levanta ct-kyc-fe en `https://localhost:9092`, con `KYC_MOCK_ACCOUNT_STEP=true` si quieres ver el paso "Cuenta".
2. Abre `https://localhost:9092` en una pestaña y acepta el certificado autofirmado (si no, el navegador bloquea el script).
3. En `.env` pon `KYC_BASE_URL=https://localhost:9092` y reinicia `npm run dev`.

Nota: StackBlitz no puede alcanzar `localhost` de tu máquina; esta opción es para correr la tienda localmente (`npm i && npm run dev`).

## Pruebas

`npm test` corre los tests del servidor (`server/createFlow.ts` y los handlers de `server/handlers.ts`) con `fetch` simulado; no tocan la API real.

## Despliegue (UAT)

La tienda vive en `https://store-conekta-kyc.uat.conekta.com`, con el mismo camino que `store-conekta-elements.uat.conekta.com` (el demo de conekta-elements):

1. **Imagen.** Cada push a `main` (o release publicado) corre `.github/workflows/build_image.yml`: construye el `Dockerfile` para amd64 y arm64 y lo sube a ECR (`462204803675.dkr.ecr.us-east-1.amazonaws.com/kyc-merchant-demo`) con los tags `<sha corto>` y `<rama o tag>`. La primera vez crea el repositorio de ECR con la política que deja leer a las cuentas de UAT y producción (`.github/workflows/policy.json`).
2. **Despliegue.** [Codeportal](https://codeportal.ops.conekta.com) escribe `stg/kyc-merchant-demo/` en `conekta/gitops-apps` y ArgoCD lo aplica en `ckt-infra-stg-eks` con el chart `conekta-service`. No se edita gitops-apps a mano.

El paso a paso (repo en la org, wizard de Codeportal, variables y verificación) está en [DEPLOY.md](DEPLOY.md).

Para probar la imagen en local:

```bash
docker build -t kyc-merchant-demo .
docker run --rm -p 3000:3000 --env-file .env kyc-merchant-demo   # http://localhost:3000
```

Sin Docker, lo mismo que corre en el pod: `npm run build && node --env-file=.env dist-server/main.js`. `npm start` también lo levanta, pero solo lee variables del entorno, no de `.env`.

## Sobre frontino-ui

El ticket pedía `@conekta/frontino-ui` 3.5.3 desde npm público, pero ese paquete se publica en GitHub Packages (registro privado, requiere token). Para que instale en StackBlitz sin registros privados, `src/theme.ts` replica sobre Mantine 8 los tokens de `kycTheme` de ct-kyc-fe (frontino 3.5.3 con su `neutral`): colores `primary` y `neutral`, espaciado, radios, tamaños de fuente, alturas de línea, encabezados, breakpoints, sombras y los defaults de `Badge` y `ThemeIcon`.
