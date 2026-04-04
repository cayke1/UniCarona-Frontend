# Campus Ride Auth

**Nome da feature:** `campus-ride-auth` — interface de autenticação do app **Campus Ride** (login, cadastro e recuperação de senha), com cliente HTTP para o backend e layout adaptado a mobile e desktop.

## O que inclui

| Item | Descrição |
|------|-----------|
| **Telas** | `login`, `register`, `forgot-password` (Expo Router) |
| **Visual** | Fundo `#f0f2f5`, primário `#3b82f6`, inputs com ícones (Ionicons) |
| **Desktop / web** | Conteúdo limitado a `AUTH_MAX_CONTENT_WIDTH` (440px), centralizado |
| **API** | `lib/api.ts` — `POST /auth/register`, `/auth/login`, `/auth/forgot-password` |
| **Sessão** | Token JWT em `expo-secure-store` (`lib/auth-token.ts`) |
| **Google** | Botão “Entrar com Google” + logo colorido (`assets/images/google-g.png`); OAuth ainda a conectar no backend |
| **Legal** | Links de termos/privacidade via `EXPO_PUBLIC_TERMS_URL` e `EXPO_PUBLIC_PRIVACY_URL` |

## Configuração

1. Copie o exemplo de ambiente:

   ```bash
   cp .env.example .env
   ```

2. Ajuste `EXPO_PUBLIC_API_URL` para a URL da API (em dispositivo físico use o IP da máquina, não `localhost`).

3. Instale dependências e suba o app:

   ```bash
   npm install
   npm run dev
   ```

## Rotas do app

| Rota | Uso |
|------|-----|
| `/login` | Entrada com email/senha e Google |
| `/register` | Cadastro com aceite de termos |
| `/forgot-password` | Solicitação de redefinição de senha |

## Contrato esperado com o backend

Base URL: `{EXPO_PUBLIC_API_URL}` (ex.: `http://192.168.0.10:3000/api`).

- **POST** `/auth/register` — corpo: `{ "name", "email", "password" }`
- **POST** `/auth/login` — corpo: `{ "email", "password" }`
- **POST** `/auth/forgot-password` — corpo: `{ "email" }`

Respostas de login/registro podem expor o token em `token`, `accessToken`, `access_token` ou dentro de `data` — ver `extractTokenFromAuthResponse` em `lib/api.ts`.

## Arquivos principais

```
app/login.tsx
app/register.tsx
app/forgot-password.tsx
components/auth/
constants/campus-ride-theme.ts
constants/legal-urls.ts
lib/api.ts
lib/auth-token.ts
```

## Ajuste de largura no desktop

Em `constants/campus-ride-theme.ts`, altere `AUTH_MAX_CONTENT_WIDTH` se quiser uma coluna mais estreita ou larga no navegador.
