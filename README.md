# UniCarona — Front-end (Expo)

Projeto em [Expo](https://expo.dev) com [Expo Router](https://docs.expo.dev/router/introduction/). HTTP com Axios (interceptors e `Authorization: Bearer`), tokens em AsyncStorage. O backend fica no repositório irmão `UniCarona-Backend`.

## Pré-requisitos

- Node.js (idealmente ≥ 20.19.4, alinhado ao React Native do projeto)
- API rodando localmente ou acessível na rede (ver README do backend)

## Instalação e ambiente

```bash
npm install
```

Copie o exemplo de variáveis e ajuste a URL da API:

```bash
cp .env.example .env
```

No PowerShell: `Copy-Item .env.example .env`

Variável principal:

| Variável | Descrição |
|----------|-----------|
| `EXPO_PUBLIC_API_URL` | URL base do backend, sem barra no final (só variáveis `EXPO_PUBLIC_*` entram no bundle) |

Conforme o ambiente de execução:

| Onde roda | URL típica |
|-----------|------------|
| Web / simulador iOS (mesma máquina) | `http://localhost:3000` |
| Emulador Android | `http://10.0.2.2:3000` |
| Dispositivo físico (mesma rede) | `http://<IP-do-computador>:3000` |

## Como rodar

```bash
npx expo start
```

Scripts úteis: `npm run android`, `npm run ios`, `npm run web`, `npm run lint`.

## API no código

| Caminho | Função |
|---------|--------|
| `lib/env.ts` | Lê `EXPO_PUBLIC_API_URL` |
| `services/api/client.ts` | Instância Axios, interceptors (Bearer no request; em 401 limpa tokens) |
| `services/auth/token-storage.ts` | Access e refresh token no AsyncStorage |
| `services/api/health.ts` | Exemplo: `GET /api/health` |

Na aba **Explore**, o bloco **API, Axios e token** dispara o health check, mostra a base URL e permite salvar ou limpar um token de teste para validar o header. Em **Expo web**, bloqueio por CORS depende da configuração do servidor; em iOS/Android nativo isso não se aplica da mesma forma.

## Template Expo (referência)

Após `npx expo start`, dá para abrir em build de desenvolvimento, emulador Android, simulador iOS ou [Expo Go](https://expo.dev/go). Edição principal na pasta `app/`.

Para zerar o app e começar do modelo em branco (código atual vai para `app-example`):

```bash
npm run reset-project
```

Documentação: [Expo](https://docs.expo.dev/), [tutorial](https://docs.expo.dev/tutorial/introduction/).
