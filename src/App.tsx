import { notifyMascot } from "./lib/mascot-events";
import { useCallback, useEffect, useState } from "react";
import CadernoView from "./components/CadernoView";
import DiscursivasView from "./components/DiscursivasView";
import Landing from "./components/Landing";
import LoginScreen from "./components/LoginScreen";
import JuWelcomeMusic from "./components/JuWelcomeMusic";
import PeaceBackground from "./components/PeaceBackground";
import ProfileBadge from "./components/ProfileBadge";
import SiteHeader from "./components/SiteHeader";
import TutorBot from "./components/TutorBot";
import UploadView from "./components/UploadView";
import type { CadernoEntry, RevisaoErro } from "./lib/caderno";
import { salvarCaderno } from "./lib/caderno";
import type { NotasCadernos } from "./lib/exame2027";
import {
  carregarDadosPerfil,
  salvarDadosPerfil,
  type DadosPerfil,
  type Perfil,
} from "./lib/profiles";
import type { RespostaRegistrada } from "./lib/tutor";

interface SessaoLegada {
  fila: string[];
  respostas: Record<string, RespostaRegistrada>;
  elapsed: number;
  nome: string;
  provaId: string;
}
const notasVazias = (): NotasCadernos => ({ biologia: null, quimica: null, redacao: null });
const sessaoVazia = (): SessaoLegada => ({
  fila: [],
  respostas: {},
  elapsed: 0,
  nome: "Exame Discursivo UERJ 2027",
  provaId: "discursivo-2027",
});

function useHashRoute() {
  const [rota, setRota] = useState("/");
  useEffect(() => {
    const atualizar = () => setRota((window.location.hash || "#/").slice(1) || "/");
    atualizar();
    window.addEventListener("hashchange", atualizar);
    return () => window.removeEventListener("hashchange", atualizar);
  }, []);
  const navegar = useCallback((destino: string) => {
    window.location.hash = destino;
  }, []);
  return { rota, navegar };
}

export default function App() {
  const { rota, navegar } = useHashRoute();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [caderno, setCaderno] = useState<CadernoEntry[]>([]);
  const [notas, setNotas] = useState<NotasCadernos>(notasVazias);
  const [revisoes, setRevisoes] = useState<RevisaoErro[]>([]);

  useEffect(() => {
    try {
      const id = localStorage.getItem("tutor-uerj-perfil-ativo");
      const perfis = JSON.parse(localStorage.getItem("tutor-uerj-perfis") || "[]") as Perfil[];
      setPerfil(perfis.find((item) => item.id === id) ?? null);
    } catch {
      setPerfil(null);
    }
  }, []);

  useEffect(() => {
    if (!perfil) return;
    localStorage.setItem("tutor-uerj-perfil-ativo", perfil.id);
    const dados = carregarDadosPerfil(perfil.id);
    setCaderno(dados?.caderno ?? []);
    setNotas(dados?.notasCadernos ?? notasVazias());
    setRevisoes(dados?.revisoes ?? []);
  }, [perfil]);

  useEffect(() => {
    if (!perfil) return;
    const dados: DadosPerfil = { sessao: sessaoVazia(), caderno, notasCadernos: notas, revisoes };
    salvarDadosPerfil(perfil.id, dados);
  }, [perfil, caderno, notas, revisoes]);

  useEffect(() => {
    if (perfil?.id) notifyMascot({ type: "welcome" });
  }, [perfil?.id]);

  const processarUpload = (entry: CadernoEntry) =>
    setCaderno((atual) => {
      const novo = [entry, ...atual];
      salvarCaderno(novo);
      return novo;
    });
  const adicionarRevisao = (revisao: RevisaoErro) =>
    setRevisoes((atual) => [
      revisao,
      ...atual.filter((item) => item.questaoId !== revisao.questaoId || item.concluidaEm),
    ]);
  const concluirRevisao = (id: string) =>
    setRevisoes((atual) =>
      atual.map((item) =>
        item.id === id ? { ...item, concluidaEm: new Date().toISOString() } : item,
      ),
    );
  const trocarPerfil = () => {
    localStorage.removeItem("tutor-uerj-perfil-ativo");
    setPerfil(null);
    navegar("/");
  };

  if (!perfil)
    return (
      <>
        <PeaceBackground />
        <LoginScreen onLogin={setPerfil} />
        <TutorBot
          questaoAtiva={null}
          abertoExternamente={false}
          onFecharExterno={() => {}}
          perguntaInicial={null}
          onLimparPerguntaInicial={() => {}}
        />
      </>
    );

  return (
    <div className="min-h-screen">
      {perfil.id === "jujuba" && <JuWelcomeMusic key={perfil.id} />}
      <PeaceBackground />
      <SiteHeader rota={rota} navegar={navegar} onExame={() => navegar("/discursivas")} />
      <div className="fixed right-4 top-[76px] z-30">
        <ProfileBadge perfil={perfil} onTrocarPerfil={trocarPerfil} />
      </div>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {rota === "/discursivas" || rota === "/prova" ? (
          <DiscursivasView
            voltar={() => navegar("/")}
            notas={notas}
            onNotas={setNotas}
            onRevisao={adicionarRevisao}
          />
        ) : rota === "/enviar" ? (
          <UploadView
            onProcessar={processarUpload}
            navegar={navegar}
            totalEntradas={caderno.length}
          />
        ) : rota === "/caderno" ? (
          <CadernoView revisoes={revisoes} onConcluir={concluirRevisao} navegar={navegar} />
        ) : (
          <Landing
            conceitoEQ={perfil.conceitoEQ ?? null}
            notas={notas}
            revisoes={revisoes}
            navegar={navegar}
          />
        )}
      </main>
      <TutorBot
        questaoAtiva={null}
        abertoExternamente={false}
        onFecharExterno={() => {}}
        perguntaInicial={null}
        onLimparPerguntaInicial={() => {}}
      />
      <footer className="mt-10 border-t border-ink-800">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-ink-400">
          Preparação focada no Exame Discursivo de Medicina · UERJ 2027
        </div>
      </footer>
    </div>
  );
}
