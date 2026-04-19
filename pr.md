# Checklist da Sprint02

- [x] **Autenticação alinhada ao backend** — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/forgot-password`, `POST /auth/reset-password`; persistência de `accessToken` + `refreshToken`; web com `localStorage`, nativo com `expo-secure-store` e fallback.
- [x] **Sessão e perfil** — `GET /users/me` via `UserProvider`; em **401** tenta refresh automático e refaz `me`; logout chama `logout` no servidor (quando há refresh) e limpa tokens; normalização de usuário (`lib/user-types.ts`) incluindo saldo em reais como **string** / **Decimal** (`toNumber`).
- [x] **Registro pós-201** — persiste tokens, `refreshUser()` e redireciona para `/(tabs)` (resposta `AuthResponse` do back).
- [x] **Navegação** — guard no `_layout` (login/register/forgot vs tabs); rotas `become-driver`, `publish-ride`, `ride/[id]`; links para perfil em **`/(tabs)/profile`** (incl. após publicar carona).
- [x] **Tela de detalhes da carona** — `GET /rides/:id`, normalização de payload, decisão motorista vs passageiro, componentes dedicados.
- [x] **T-22 — Solicitar entrada** — stepper de assentos, embarque/desembarque, prévia (subtotal + taxa de serviço ~10%), `POST /rides/:id/requests`, toast de confirmação.
- [x] **T-23 — Gerenciar solicitações** — listagem de pendentes, aceitar/recusar com `PATCH /requests/:id` (`ACCEPTED` / `REJECTED`), atualização otimista (lista + `availableSeats`).

---

# Arquivos criados

| Arquivo | Descrição |
|--------|-----------|
| `app/ride/[id].tsx` | Rota dinâmica — `rideApi.getById`, `useCurrentUser`, normaliza resposta e renderiza `DriverRideScreen` ou `PassengerRideScreen`. |
| `components/DriverRideScreen.tsx` | View do motorista — solicitações, aceitar/recusar, optimistic update. |
| `components/PassengerRideScreen.tsx` | View do passageiro — modal de solicitação (T-22), CTA conforme estado da carona. |
| `hooks/use-current-user.ts` | Usuário autenticado + papel (`driver` / `passenger`) para comparação com `ride.driver.id`. |
| `types/ride.ts` | Tipos `Ride`, `PassengerRequest`, `RideStatus`, etc. |
| `lib/ride-fetch.ts` | Helpers de fetch/normalização de caronas (se usados pelo mapa ou fluxos relacionados). |


---

# Arquivos modificados (principais)

| Arquivo | O que mudou |
|---------|-------------|
| `lib/api.ts` | `authApi` (register, login, **refresh**, **logout**, forgot, **resetPassword**), `extractRefreshTokenFromAuthResponse`, `persistTokensFromAuthResponse`, `userApi`, `ridesApi`, `rideApi`, tipos de payload. |
| `lib/auth-token.ts` | Chave de refresh; `saveRefreshToken` / `getRefreshToken`; `clearAuthToken` limpa access **e** refresh. |
| `contexts/user-context.tsx` | Refresh automático em 401 antes de invalidar sessão. |
| `app/login.tsx` / `app/register.tsx` | Uso de `persistTokensFromAuthResponse`; registro com entrada direta nas tabs + `refreshUser`. |
| `app/(tabs)/profile.tsx` | Logout com `authApi.logout` quando há refresh. |
| `app/publish-ride.tsx` | Redirects para `/(tabs)/profile`. |
| `app/_layout.tsx` | `UserProvider`, stack com `become-driver`, `publish-ride`, `ride/[id]`. |
| `lib/user-types.ts` | `normalizeUserPayload` — saldo (`balance`) com string Decimal / `toNumber()`. |
## Roteamento por papel

A rota `app/ride/[id].tsx` é uma camada fina: após carregar a carona e o usuário (`useCurrentUser`), define motorista quando `user.role === 'driver'` **e** `ride.driver.id === user.id`; caso contrário renderiza a experiência de passageiro.

## Mapeamentos backend

- Endereços: `originAddress` / `destinationAddress` (fallback para `origin` / `destination` string).
- Coordenadas: `originLat`, `originLng`, `destinationLat`, `destinationLng` → objeto `{ latitude, longitude }` para mapa/snapshot.
- Preço por vaga: `costPerSeat` (fallback `price`).
- Status do ride (uppercase): `ACTIVE` → `open` ou `full` conforme `availableSeats`; `CANCELLED` / `COMPLETED` mapeados.
- Status da solicitação: `ACCEPTED`, `AWAITING_PAYMENT`, `PAID` → tratados como aceitos no modelo de UI; `REJECTED` / `CANCELLED` como recusados.
- Aceitar/recusar: `PATCH /requests/:id` com `{ status: 'ACCEPTED' \| 'REJECTED' }`.

## Modal de solicitação (T-22)

Stepper de 1 até `availableSeats`; embarque/desembarque alinhados à origem/destino da carona; prévia no cliente: subtotal = assentos × preço por vaga; taxa de serviço (~10%); toast após sucesso do `POST /rides/:id/requests`.

## Optimistic updates (T-23)

Aceitar: remove o item da lista pendente e decrementa `availableSeats` localmente pelo `requestedSeats`. Recusar: remove o card imediatamente. *(Time-based freeze / bloqueio por horário: implementar quando o contrato da API estiver definido.)*
