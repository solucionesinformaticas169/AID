# AIDLABORAL S.A.S.

Plataforma ATS para gestion de reclutamiento, publicacion de vacantes, postulaciones, planes empresariales, billing SaaS y administracion operativa.

## Arquitectura

Monorepo con `npm workspaces`:

- `apps/web`: frontend en Next.js App Router
- `apps/api`: backend en NestJS
- PostgreSQL + Prisma

## Stack

- Frontend: Next.js 16, TypeScript, Tailwind CSS, shadcn/ui
- Backend: NestJS 11, TypeScript
- ORM: Prisma
- Base de datos: PostgreSQL
- Seguridad: bcrypt, JWT access/refresh, throttling, helmet, CORS
- Infraestructura: Railway + Vercel + PostgreSQL

## Modulos Backend

- `auth`: registro, login, refresh token, logout
- `users`: consulta y actualizacion de usuarios
- `candidate`: dashboard y perfil de candidato
- `companies`: empresas, aprobacion y dashboard empresarial
- `jobs`: vacantes y publicacion con validacion de plan
- `applications`: postulaciones
- `plans`: catalogo de planes y control de cargas
- `payments`: billing, checkout, invoices, webhooks firmados
- `admin`: moderacion y supervision
- `health`: healthcheck de despliegue

Cada modulo sigue una separacion base por:

- `controller`
- `service`
- `repository`
- `dto`

## Frontend

El frontend usa App Router y tiene:

- home publica
- login y registro
- dashboards separados para candidato, empresa y administrador
- layouts por area
- middleware para rutas protegidas
- helper de sesion basado en JWT

Rutas protegidas:

- `/candidato`
- `/empresa`
- `/admin`

## Seguridad

- Hash de contrasenas con `bcryptjs`
- `JWT access` y `JWT refresh`
- `JwtAuthGuard`
- `RolesGuard`
- `ValidationPipe` global
- `helmet`
- `@nestjs/throttler`
- `CORS` configurable por entorno
- webhooks firmados para Stripe, PayPal y PayPhone
- autorizacion de billing por rol y pertenencia de empresa

## Logica de planes

- Cada empresa inicia con `10` cargas gratuitas
- Publicar una vacante consume `1` carga
- Si se agotan las `10`, la empresa necesita una suscripcion activa
- Planes base:
  - `FREE`
  - `PROFESSIONAL`
  - `ENTERPRISE`

## Seed inicial

El seed crea:

- roles base automaticos
- planes base
- admin inicial
- empresa demo aprobada solo si `SEED_DEMO_COMPANY=true`

Credenciales iniciales por defecto:

- email: `admin@aidlaboral.com`
- password: `Admin123*`

## Variables de entorno

Usa [.env.example](C:/Users/Adrian/Documents/New%20project%207/.env.example) como referencia.

Variables importantes:

- `DATABASE_URL`
- `PORT`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `CORS_ALLOW_VERCEL_PREVIEWS`
- `NEXT_PUBLIC_API_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`
- `SEED_DEMO_COMPANY`
- `STRIPE_*`
- `PAYPAL_*`
- `PAYPHONE_*`

## Instalacion local

```bash
npm install
```

Generar Prisma Client:

```bash
npm run prisma:generate
```

Seed inicial:

```bash
npm run prisma:seed
```

Build completo:

```bash
npm run build
```

## Desarrollo

Frontend:

```bash
npm run dev:web
```

Backend:

```bash
npm run dev:api
```

## Docker

Levantar PostgreSQL, backend y frontend:

```bash
docker-compose up --build
```

Servicios:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000/api`
- PostgreSQL: `localhost:5432`

## Deploy Produccion

### Topologia recomendada

- `PostgreSQL real`: Railway PostgreSQL o proveedor administrado externo
- `Backend`: Railway
- `Frontend`: Vercel
- `Migrations`: Prisma `migrate deploy`

### Backend en Railway

1. Crea un proyecto en Railway.
2. Agrega un servicio PostgreSQL real.
3. Importa este repositorio como servicio backend.
4. Usa la raiz del repositorio como fuente del servicio.
5. Railway tomara [railway.toml](C:/Users/Adrian/Documents/New%20project%207/railway.toml) para:
   - compilar `apps/api`
   - correr `prisma migrate deploy` antes del release
   - iniciar la API en produccion
   - esperar `GET /api/health` como healthcheck

Scripts backend relevantes:

- `npm run prisma:generate -w apps/api`
- `npm run prisma:migrate:deploy -w apps/api`
- `npm run start:prod -w apps/api`

### Variables backend Railway

Configura estas variables en Railway:

- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...`
- `PORT=4000`
- `FRONTEND_URL=https://tu-frontend.vercel.app`
- `CORS_ORIGINS=https://tu-frontend.vercel.app`
- `CORS_ALLOW_VERCEL_PREVIEWS=true`
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN=7d`
- `INITIAL_ADMIN_EMAIL=admin@tu-dominio.com`
- `INITIAL_ADMIN_PASSWORD=...`
- `SEED_DEMO_COMPANY=false`
- `STORAGE_DRIVER=supabase` o `s3`
- `SUPABASE_*` o `AWS_*`
- `STRIPE_*`
- `PAYPAL_*`
- `PAYPHONE_*`

### Frontend en Vercel

1. Importa el mismo repositorio en Vercel.
2. Configura `Root Directory = apps/web`.
3. Framework: `Next.js`.
4. Asocia variables del frontend.

Variables frontend Vercel:

- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=https://tu-backend.railway.app/api`
- `JWT_ACCESS_SECRET=debe-coincidir-con-backend`

### Prisma en produccion

Prisma recomienda `migrate deploy` para produccion.

Comando:

```bash
npm run prisma:migrate:deploy -w apps/api
```

Este comando:

- aplica migraciones pendientes
- no usa shadow database
- no resetea datos

### Seed inicial en produccion

El seed es idempotente y esta pensado para bootstrap inicial:

- crea roles
- crea planes
- crea admin inicial

No crea empresa demo a menos que `SEED_DEMO_COMPANY=true`.

Ejecutalo una sola vez tras el primer deploy:

```bash
npm run prisma:seed -w apps/api
```

Hazlo desde Railway Shell o como comando manual del servicio.

### CORS de produccion

La API soporta:

- `CORS_ORIGINS` como lista separada por comas
- `FRONTEND_URL` como fallback simple
- `CORS_ALLOW_VERCEL_PREVIEWS=true` para permitir previews `*.vercel.app`

### Healthcheck

Endpoint listo:

- `GET /api/health`

Respuesta esperada:

- `200 OK`
- estado `ok`
- validacion basica de acceso a PostgreSQL

### URLs publicas esperadas

- frontend: `https://tu-frontend.vercel.app`
- backend: `https://tu-backend.railway.app`
- api: `https://tu-backend.railway.app/api`
- healthcheck: `https://tu-backend.railway.app/api/health`

### Orden recomendado de salida a produccion

1. Provisiona PostgreSQL real.
2. Configura variables backend en Railway.
3. Despliega backend.
4. Verifica `GET /api/health`.
5. Ejecuta seed inicial una vez.
6. Configura variables frontend en Vercel.
7. Despliega frontend.
8. Actualiza `FRONTEND_URL` y `CORS_ORIGINS` con la URL final del frontend.
9. Configura webhooks productivos de Stripe, PayPal y PayPhone apuntando al backend Railway.

## Endpoints base

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Companies:

- `GET /api/companies/:companyId/dashboard`
- `GET /api/companies/:companyId/publishing-status`
- `PATCH /api/companies/:companyId/approve`

Jobs:

- `GET /api/jobs/public`
- `GET /api/jobs/:slug`
- `POST /api/jobs`

Admin:

- `GET /api/admin/dashboard`
- `GET /api/admin/companies/pending`
- `GET /api/admin/users`

Health:

- `GET /api/health`

## Estado actual

La plataforma ya tiene:

- backend NestJS modular
- frontend Next.js con dashboards
- Prisma y migraciones
- billing SaaS
- webhooks firmados
- healthcheck de produccion
- configuracion base para Railway y Vercel

Para salir en vivo aun necesitas cargar credenciales y valores reales:

- `DATABASE_URL` productiva
- dominios publicos finales
- credenciales de Stripe, PayPal y PayPhone
- bucket real de documentos
