/** Traduz mensagens comuns do backend (inglês) para português na UI. */
const MESSAGE_MAP: Array<{ match: RegExp; pt: string }> = [
  {
    match: /driver already has an active ride/i,
    pt: 'Você já tem uma carona ativa. Encerre ou cancele a atual antes de publicar outra.',
  },
  {
    match: /user already is a driver/i,
    pt: 'Você já está cadastrado como motorista.',
  },
  {
    match: /pix key is required/i,
    pt: 'Informe uma chave PIX para ativar o perfil de motorista.',
  },
  {
    match: /ride has already departed/i,
    pt: 'Esta carona já partiu.',
  },
  {
    match: /ride is not active/i,
    pt: 'Esta carona não está mais ativa.',
  },
  {
    match: /not enough available seats/i,
    pt: 'Não há vagas suficientes nesta carona.',
  },
  {
    match: /route not found/i,
    pt: 'Rota não encontrada no servidor.',
  },
  {
    match: /invalid input data/i,
    pt: 'Dados inválidos. Revise os campos e tente novamente.',
  },
];

export function translateApiMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return trimmed;

  for (const { match, pt } of MESSAGE_MAP) {
    if (match.test(trimmed)) return pt;
  }

  return trimmed;
}
