# Despliegue en UAT

Paso a paso para publicar la tienda en `https://store-conekta-kyc.uat.conekta.com`. Sigue el mismo camino que `https://store-conekta-elements.uat.conekta.com`, que en Codeportal es la app `conekta-elements-demo`.

```
merge a main ──▶ GitHub Actions ──▶ ECR ──▶ Codeportal ──▶ conekta/gitops-apps ──▶ ArgoCD ──▶ ckt-infra-stg-eks
                 (build_image.yml)   (imagen     (Deploy)     (stg/kyc-merchant-demo/)        (chart conekta-service,
                                      <sha corto>)                                             gateway uat-public)
```

Los pasos 1 y 2 se hacen una sola vez. Para los despliegues siguientes ve a [Despliegues siguientes](#despliegues-siguientes).

## Requisitos

- Estar conectado a la VPN: Codeportal solo responde dentro.
- Entrar a [Codeportal](https://codeportal.ops.conekta.com) con rol developer o superior (grupo de Keycloak `/ckt-codeportal-developer-team`) y pertenecer al equipo que será dueño de la app.
- Tener la llave privada y la llave pública de staging del merchant que tiene KYC configurado.

## 1. Mover el repo a la org y generar la primera imagen

El workflow usa los secrets `ECR_AWS_*` y los runners `aws-runner-set` de la org `conekta`, que un repo personal no tiene.

1. Transfiere `pedroruizconekta/kyc-merchant-demo` a la org `conekta`. En GitHub: **Settings → General → Danger Zone → Transfer ownership**. Si no tienes permiso para crear repos en la org, pídeselo a un admin. **Conserva el nombre `kyc-merchant-demo`**: el repositorio de ECR toma el nombre del repo de GitHub.
2. Haz merge a `main`. El workflow **Push the Docker image to AWS ECR Repo** corre solo. También lo puedes lanzar a mano desde **Actions → Push the Docker image to AWS ECR Repo → Run workflow**.
3. Cuando termine en verde, anota el sha corto del commit (los primeros 7 caracteres). Ese es el tag de la imagen: `462204803675.dkr.ecr.us-east-1.amazonaws.com/kyc-merchant-demo:<sha corto>`.

La primera corrida también crea el repositorio de ECR, con la política que deja leer la imagen a las cuentas de UAT y producción. Codeportal solo muestra las imágenes que ya existen en ECR, así que este paso va antes del wizard.

Si el workflow falla:

| Síntoma | Causa |
| --- | --- |
| El job se queda esperando runner | El repo no tiene acceso al grupo de runners `aws-runner-set`. Un admin de la org lo agrega. |
| Falla en **Configure AWS credentials** por credenciales vacías | El repo no tiene acceso a los secrets de la org `ECR_AWS_ACCESS_KEY_ID` y `ECR_AWS_SECRET_ACCESS_KEY`. Un admin de la org lo agrega. |

## 2. Crear la app con el wizard

Abre **New Service Wizard** en `https://codeportal.ops.conekta.com/services/wizard`. Tiene cinco pasos.

### Application

Elige crear una aplicación nueva, no una existente.

| Campo | Valor |
| --- | --- |
| Application Name | `kyc-merchant-demo` |
| Namespace | `kyc-merchant-demo` (si lo dejas vacío toma el nombre de la app) |
| Repository URL | `https://github.com/conekta/kyc-merchant-demo` |
| Project | `webapp` (el mismo que `conekta-elements-demo`) |
| Team | tu equipo |

### Service

| Campo | Valor |
| --- | --- |
| Service Name | `kyc-merchant-demo` (también es el nombre del release y el `DD_SERVICE`) |
| Container Image | `kyc-merchant-demo` |
| Service Type | `web-service` |
| Public (internet-facing) | **activado**. Sin esto el sitio queda interno y usa el gateway privado. |
| HTTP/2 backend | apagado |
| Shared memory, OpenAPI path | vacíos |

### Configuration

| Campo | Valor |
| --- | --- |
| Environments | solo UAT |
| Resource Profile | el de CPU 250m/500m y memoria 256Mi/512Mi (el mismo que `conekta-elements-demo`) |
| Hostname | `store-conekta-kyc`: solo el subdominio, Codeportal agrega `.uat.conekta.com` |
| Port | **`3000`**. El default es 8080 y hay que cambiarlo. |
| Replicas | `1` |
| Health Check Path | `/ping` |

### Secrets

Aquí van las variables de entorno. Pega este YAML con las llaves reales:

```yaml
application: kyc-merchant-demo
type: k8s
secrets:
  KYC_DEMO_ENV:
    description: Variables de la tienda demo de KYC
    stg:
      CONEKTA_PRIVATE_KEY: key_...                # llave privada de staging
      CONEKTA_PUBLIC_KEY: key_...                 # llave pública del mismo merchant
      KYC_BASE_URL: https://kyc.stg.conekta.io
      CONEKTA_API_URL: https://api.stg.conekta.io
```

- `type: k8s` hace que cada clave se vuelva una variable de entorno del pod.
- `stg` es el nombre de la carpeta del ambiente UAT en gitops-apps. También acepta el nombre del ambiente tal como aparece en Codeportal.
- **La llave privada queda en texto plano** en `stg/kyc-merchant-demo/values.yaml` de `conekta/gitops-apps`, igual que en `conekta-elements-demo`. Cualquiera con acceso a ese repo la puede ver.
- No agregues `DD_ENV`, `DD_SERVICE` ni `DD_VERSION`: Codeportal los pone en cada deploy.
- `KYC_BASE_URL` va con `kyc.stg.conekta.io` y no con `kyc.uat.conekta.com`, porque este último no sirve el loader (`/v1.0/js/conekta-kyc.min.js` responde 404). La API tiene que ser del mismo ambiente.

### Deploy

Haz clic en **Skip Deploy**. Antes del primer deploy hay que activar Platform routing (paso 3), y el wizard no tiene esa opción. Si despliegas sin ella, el chart crea un ALB propio en lugar de la ruta en el gateway compartido.

## 3. Activar Platform routing

En **Configurations**, abre la configuración de `kyc-merchant-demo` en UAT y edítala:

| Campo | Valor |
| --- | --- |
| Subdomain | debe mostrar `store-conekta-kyc.uat.conekta.com` con la etiqueta `public` |
| Platform routing | **activado** |
| Route path | vacío |
| Strip prefix | apagado |
| Datadog APM / Datadog logs | apagados (logs se cobra por GB; actívalo solo si lo necesitas) |

Guarda.

## 4. Desplegar

En **Deployments → crear**:

| Campo | Valor |
| --- | --- |
| Configuration | la de `kyc-merchant-demo` en UAT |
| Image Tag | el sha corto del paso 1 |

El deploy termina en `synced`. Si termina en `committed`, el commit en gitops-apps sí se hizo pero el sync inmediato falló, y ArgoCD lo aplica en su siguiente ciclo.

## 5. Verificar

```bash
curl https://store-conekta-kyc.uat.conekta.com/ping        # pong
curl https://store-conekta-kyc.uat.conekta.com/config.js   # window.__KYC_DEMO__ = {"publicKey":"key_…","kycBaseUrl":"https://kyc.stg.conekta.io"};
```

Después abre `https://store-conekta-kyc.uat.conekta.com` en el navegador: debe crear un flujo y mostrar el iframe del KYC. El DNS lo da de alta external-dns y puede tardar unos minutos en propagar.

En `conekta/gitops-apps`, el archivo `stg/kyc-merchant-demo/values.yaml` debe quedar parecido a esto:

```yaml
image:
  name: kyc-merchant-demo
  tag: <sha corto>
port: 3000
domain: uat.conekta.com
ingress:
  enabled: false
  subdomain: store-conekta-kyc
  scheme: internet-facing
routing:
  enabled: true
  gateway: uat-public
probes:
  liveness:
    path: /ping
  readiness:
    path: /ping
env:
  CONEKTA_PRIVATE_KEY: key_…
  CONEKTA_PUBLIC_KEY: key_…
  KYC_BASE_URL: https://kyc.stg.conekta.io
  CONEKTA_API_URL: https://api.stg.conekta.io
  DD_ENV: uat
  # …
```

Si ves `ingress.enabled: true` y no hay bloque `routing`, Platform routing no quedó activado: repite el paso 3 y despliega de nuevo.

| Síntoma | Dónde ver |
| --- | --- |
| La URL no responde | **Infrastructure → Istio Routing** muestra el HTTPRoute y el motivo si el gateway lo rechazó. |
| El pod reinicia o no arranca | En el visor del cluster de Codeportal, los logs del pod en el namespace `kyc-merchant-demo`. Al arrancar, el server imprime `[kyc-merchant-demo] http://localhost:3000`. |
| El log dice `sin CONEKTA_PRIVATE_KEY` | El secret `KYC_DEMO_ENV` no llegó al pod. Revisa que tenga valor para UAT y despliega de nuevo. |
| La página carga pero dice "No se pudo cargar el flujo de verificación" | Abre `/config.js` y revisa `publicKey` y `kycBaseUrl`. |

## Despliegues siguientes

Cada merge a `main` publica una imagen nueva con el sha corto del commit. Para desplegarla ve a **Deployments → crear**, elige la misma configuración y pon el tag nuevo.

Para cambiar una variable, edita su valor para UAT en **Secrets → `KYC_DEMO_ENV`** y despliega de nuevo. Puedes usar el mismo tag: si los valores no cambiaron, Codeportal reinicia los pods en lugar de hacer un commit.
