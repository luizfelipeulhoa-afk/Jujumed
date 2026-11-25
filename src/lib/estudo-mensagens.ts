export const MSG_GEMINI_AUSENTE =
  "Ainda não dá para resumir: falta a chave do Gemini no servidor. Cadastre GEMINI_API_KEY como Secret em Cloudflare → jujumed → Settings → Variables and Secrets e publique de novo. O restante do Jujumed continua funcionando.";

export const MSG_GEMINI_COTA =
  "O Gemini atingiu o limite gratuito agora. Espere um minuto e tente de novo. Isso não gera cobrança.";

export const MSG_GROQ_AUSENTE =
  "Ainda não dá para usar o quiz nem a transcrição: falta a chave da Groq no servidor. Cadastre GROQ_API_KEY como Secret em Cloudflare → jujumed → Settings → Variables and Secrets e publique de novo. O restante do Jujumed continua funcionando.";

export const MSG_GROQ_COTA =
  "A Groq atingiu o limite gratuito agora. Espere um minuto e tente de novo. Isso não gera cobrança.";

export const MSG_GROQ_CHAVE =
  "A Groq recusou a chave. Confira se GROQ_API_KEY é uma chave gratuita criada em console.groq.com/keys e publique de novo.";

export const MSG_GROQ_TEMPO = "A Groq demorou para responder. Tente novamente em instantes.";

export const MSG_GROQ_INDISPONIVEL =
  "A Groq está temporariamente indisponível. Tente novamente em instantes.";

export const MSG_GROQ_CONEXAO =
  "Não foi possível falar com a Groq. O restante do site continua funcionando. Tente de novo em instantes.";

export const MSG_QUIZ_FORMATO =
  "O quiz veio incompleto. Tente de novo com um trecho mais curto da aula.";

export const MSG_AUDIO_GRANDE =
  "Esse áudio é grande demais para a cota gratuita. Envie um trecho de até 18 MB.";

export const MSG_AUDIO_TIPO =
  "Esse arquivo não é um áudio aceito. Use mp3, m4a, wav, ogg, flac ou webm.";

export const MSG_AUDIO_VAZIO =
  "Não encontrei fala nesse áudio. Grave de novo, mais perto do microfone, ou envie outro trecho.";

export const MSG_SEM_ARQUIVO = "Escolha ou grave um áudio da aula antes de transcrever.";

export const MSG_TRANSCRICAO_CONEXAO =
  "Não consegui falar com o servidor de transcrição. Atualize a página e tente de novo.";
