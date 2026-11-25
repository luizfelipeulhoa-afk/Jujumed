import { FOCOS_ESTUDO, ROTULOS_FOCO, type FocoEstudo } from "../lib/estudo";

export function AvisoDados({ gemini }: { gemini: boolean }) {
  return (
    <p className="rounded-lg border border-uerj-gold/40 bg-ink-800/80 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-200">
      Não envie dados pessoais, nomes de pacientes nem casos clínicos reais.
      {gemini
        ? " Na camada gratuita, o Gemini pode usar o que você envia para melhorar os produtos do Google."
        : ""}
    </p>
  );
}

export function FaixaErro({ mensagem, onTentar }: { mensagem: string; onTentar?: () => void }) {
  return (
    <div
      className="rounded-lg border border-uerj-gold/50 bg-ink-800 px-4 py-3 text-sm leading-relaxed text-ink-100"
      role="alert"
    >
      <p>{mensagem}</p>
      {onTentar && (
        <button
          type="button"
          onClick={onTentar}
          className="mt-3 rounded-lg border border-uerj-gold/60 px-3 py-1.5 text-xs font-bold text-uerj-gold"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function SeletorFoco({
  valor,
  onChange,
}: {
  valor: FocoEstudo;
  onChange: (foco: FocoEstudo) => void;
}) {
  return (
    <label className="block text-[12px] font-bold uppercase tracking-[0.12em] text-ink-300">
      Foco
      <select
        value={valor}
        onChange={(event) => {
          const foco = FOCOS_ESTUDO.find((item) => item === event.target.value);
          if (foco) onChange(foco);
        }}
        className="mt-2 w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-3 text-sm font-medium normal-case tracking-normal text-ink-100"
      >
        {FOCOS_ESTUDO.map((foco) => (
          <option key={foco} value={foco}>
            {ROTULOS_FOCO[foco]}
          </option>
        ))}
      </select>
    </label>
  );
}
