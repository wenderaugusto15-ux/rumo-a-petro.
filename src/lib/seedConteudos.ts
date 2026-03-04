import { supabase } from "@/integrations/supabase/client";
import type { SeedLog } from "./seedEstudos";

type LogCallback = (log: SeedLog) => void;

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

interface VideoItem {
  titulo: string;
  url: string;
  duracao: number;
  descricao: string;
}

interface ModuloGroup {
  materiaNome: string;
  materiaDescricao: string;
  materiaIcone: string;
  materiaCor: string;
  moduloTitulo: string;
  moduloDescricao: string;
  videos: VideoItem[];
}

const VIDEO_DATA: ModuloGroup[] = [
  // === Língua Portuguesa ===
  {
    materiaNome: "Língua Portuguesa",
    materiaDescricao: "Gramática, interpretação e redação",
    materiaIcone: "book-open",
    materiaCor: "#3B82F6",
    moduloTitulo: "Interpretação de Texto",
    moduloDescricao: "Compreensão e interpretação de textos diversos",
    videos: [
      { titulo: "Português Petrobras 2026 - Aula Completa", url: "https://www.youtube.com/watch?v=quHzomX12_g", duracao: 151, descricao: "Aula completa de Língua Portuguesa focada no concurso Petrobras com Prof. Anderson Oliveira" },
      { titulo: "Gabaritando Cesgranrio - Língua Portuguesa", url: "https://www.youtube.com/watch?v=hVMLI7fsKvA", duracao: 131, descricao: "Como gabaritar português na banca Cesgranrio para Petrobras e Transpetro" },
      { titulo: "Interpretação de Textos - Guia Completo", url: "https://www.youtube.com/watch?v=OxTNN-IKcEQ", duracao: 14, descricao: "Guia completo para arrasar na interpretação de textos em concursos" },
      { titulo: "Compreensão e Interpretação - Dicas Imprescindíveis", url: "https://www.youtube.com/watch?v=45thlAoGOGU", duracao: 13, descricao: "Diferença entre compreender e interpretar textos - dicas essenciais" },
    ],
  },
  {
    materiaNome: "Língua Portuguesa",
    materiaDescricao: "Gramática, interpretação e redação",
    materiaIcone: "book-open",
    materiaCor: "#3B82F6",
    moduloTitulo: "Gramática Essencial",
    moduloDescricao: "Concordância, regência, crase e pontuação",
    videos: [
      { titulo: "Classes Gramaticais em 13 Minutos", url: "https://www.youtube.com/watch?v=QYHrtSku8F4", duracao: 13, descricao: "Domine todas as classes gramaticais rapidamente para concursos" },
      { titulo: "Emprego de Classes Gramaticais - Cesgranrio", url: "https://www.youtube.com/watch?v=lZbZcYHONRU", duracao: 14, descricao: "Aula específica sobre classes gramaticais para Petrobras banca Cesgranrio" },
      { titulo: "Português Completo para Petrobras - Aula 1", url: "https://www.youtube.com/watch?v=mmMhBOpqWwU", duracao: 154, descricao: "Curso completo de português para Petrobras com Prof. Adriana Figueiredo" },
      { titulo: "Classes Gramaticais - Prof. Flávia Rita", url: "https://www.youtube.com/watch?v=CwmhWAKwZis", duracao: 73, descricao: "Aula completa de classes gramaticais para concursos públicos" },
    ],
  },
  {
    materiaNome: "Língua Portuguesa",
    materiaDescricao: "Gramática, interpretação e redação",
    materiaIcone: "book-open",
    materiaCor: "#3B82F6",
    moduloTitulo: "Análise Sintática",
    moduloDescricao: "Análise sintática para concursos públicos",
    videos: [
      { titulo: "Gramaticando - Análise Sintática", url: "https://www.youtube.com/watch?v=BlppOEFdDiM", duracao: 94, descricao: "Praticando gramática com foco em análise sintática para concursos" },
    ],
  },
  // === Matemática ===
  {
    materiaNome: "Matemática",
    materiaDescricao: "Raciocínio lógico e matemática aplicada",
    materiaIcone: "calculator",
    materiaCor: "#EF4444",
    moduloTitulo: "Razão e Proporção",
    moduloDescricao: "Conceitos fundamentais de razão e proporção",
    videos: [
      { titulo: "Matemática Petrobras - Aulão Completo", url: "https://www.youtube.com/watch?v=POmwZMs6Ck4", duracao: 17, descricao: "Aulão de matemática para Petrobras banca Cesgranrio - porcentagem, proporção e gráficos" },
      { titulo: "Matemática Petrobras e Transpetro", url: "https://www.youtube.com/watch?v=zwtaOnTF79M", duracao: 89, descricao: "Aula completa de matemática para concurso Petrobras com Prof. Jodeclan Souza" },
    ],
  },
  {
    materiaNome: "Matemática",
    materiaDescricao: "Raciocínio lógico e matemática aplicada",
    materiaIcone: "calculator",
    materiaCor: "#EF4444",
    moduloTitulo: "Porcentagem",
    moduloDescricao: "Cálculos de porcentagem para concursos",
    videos: [
      { titulo: "Questões de Matemática Cesgranrio - Porcentagem", url: "https://www.youtube.com/watch?v=iW-gbEOGZP4", duracao: 45, descricao: "Resolvendo questões de porcentagem da banca Cesgranrio para Banco do Brasil" },
      { titulo: "Não Erre Mais Matemática - Passo a Passo", url: "https://www.youtube.com/watch?v=T9pF80rnyFI", duracao: 26, descricao: "Macetes para resolver questões de matemática em concursos - porcentagem, MDC, perímetro" },
    ],
  },
  {
    materiaNome: "Matemática",
    materiaDescricao: "Raciocínio lógico e matemática aplicada",
    materiaIcone: "calculator",
    materiaCor: "#EF4444",
    moduloTitulo: "Regra de Três",
    moduloDescricao: "Regra de três simples e composta",
    videos: [
      { titulo: "Regra de Três na Prática - CESPE 2024", url: "https://www.youtube.com/watch?v=iSC15TpE_KQ", duracao: 3, descricao: "Questão de regra de três resolvida passo a passo - proporcionalidade direta" },
    ],
  },
  {
    materiaNome: "Matemática",
    materiaDescricao: "Raciocínio lógico e matemática aplicada",
    materiaIcone: "calculator",
    materiaCor: "#EF4444",
    moduloTitulo: "Estatística Básica",
    moduloDescricao: "Média, moda, mediana e desvio padrão",
    videos: [
      { titulo: "Matemática Cesgranrio Sem Travar - Petrobras", url: "https://www.youtube.com/watch?v=OvfSzqWzNME", duracao: 18, descricao: "Porcentagem, regra de três, estatística básica e gráficos para Petrobras" },
    ],
  },
  {
    materiaNome: "Matemática",
    materiaDescricao: "Raciocínio lógico e matemática aplicada",
    materiaIcone: "calculator",
    materiaCor: "#EF4444",
    moduloTitulo: "Matemática Financeira",
    moduloDescricao: "Juros simples e compostos",
    videos: [
      { titulo: "Resolução Prova Transpetro 2018 - Matemática", url: "https://www.youtube.com/watch?v=zRlIKk--gBs", duracao: 103, descricao: "Resolução completa da prova de matemática nível técnico Transpetro 2018" },
    ],
  },
  // === Física ===
  {
    materiaNome: "Física",
    materiaDescricao: "Física aplicada para engenharia e operação",
    materiaIcone: "atom",
    materiaCor: "#F97316",
    moduloTitulo: "Termodinâmica",
    moduloDescricao: "Leis da termodinâmica e aplicações",
    videos: [
      { titulo: "Termodinâmica Petrobras 2026 - Resolvendo e Aprendendo", url: "https://www.youtube.com/watch?v=vr-PeCogymw", duracao: 56, descricao: "Resolução de questões de termodinâmica para Engenheiro de Equipamentos Mecânica" },
      { titulo: "Termodinâmica Petrobras 2025 - Engenharia Mecânica", url: "https://www.youtube.com/watch?v=uwoHT_CZQQA", duracao: 38, descricao: "Aula resolvendo questões de termodinâmica para concurso Petrobras" },
      { titulo: "Resolução Questão Petrobras - Termodinâmica", url: "https://www.youtube.com/watch?v=JGOSG6BwLqw", duracao: 10, descricao: "Primeira lei da termodinâmica - questão resolvida da Transpetro" },
      { titulo: "Termodinâmica - Conceitos Introdutórios", url: "https://www.youtube.com/watch?v=dRZ1sfXuHPY", duracao: 25, descricao: "Sistema aberto e fechado, propriedades extensivas e intensivas" },
    ],
  },
  {
    materiaNome: "Física",
    materiaDescricao: "Física aplicada para engenharia e operação",
    materiaIcone: "atom",
    materiaCor: "#F97316",
    moduloTitulo: "Mecânica",
    moduloDescricao: "Mecânica clássica e aplicações",
    videos: [
      { titulo: "Revisão de Física para Operação - Petrobras", url: "https://www.youtube.com/watch?v=bblEDVoneA0", duracao: 99, descricao: "Revisão completa de física para técnico de operação Petrobras banca Cebraspe" },
    ],
  },
  // === Química ===
  {
    materiaNome: "Química",
    materiaDescricao: "Química geral e orgânica para concursos",
    materiaIcone: "flask-conical",
    materiaCor: "#A855F7",
    moduloTitulo: "Química Geral",
    moduloDescricao: "Fundamentos de química geral",
    videos: [
      { titulo: "Química Cesgranrio - Petrobras Técnico de Operação", url: "https://www.youtube.com/watch?v=ABFGwF2pWUA", duracao: 3, descricao: "Questão de equilíbrio químico resolvida para técnico de operação Petrobras" },
    ],
  },
  {
    materiaNome: "Química",
    materiaDescricao: "Química geral e orgânica para concursos",
    materiaIcone: "flask-conical",
    materiaCor: "#A855F7",
    moduloTitulo: "Química Orgânica",
    moduloDescricao: "Introdução à química orgânica",
    videos: [
      { titulo: "Introdução à Química Orgânica - Aula Completa", url: "https://www.youtube.com/watch?v=fuco39FwNPY", duracao: 75, descricao: "Aula completa de introdução à química orgânica para ENEM e concursos" },
    ],
  },
  // === Informática ===
  {
    materiaNome: "Informática",
    materiaDescricao: "Informática básica para concursos",
    materiaIcone: "monitor",
    materiaCor: "#8B5CF6",
    moduloTitulo: "Segurança da Informação",
    moduloDescricao: "Segurança digital e proteção de dados",
    videos: [
      { titulo: "Segurança da Informação para Concursos", url: "https://www.youtube.com/watch?v=jBMMXamVot4", duracao: 49, descricao: "Aula completa de segurança da informação para concursos públicos" },
    ],
  },
  {
    materiaNome: "Informática",
    materiaDescricao: "Informática básica para concursos",
    materiaIcone: "monitor",
    materiaCor: "#8B5CF6",
    moduloTitulo: "Microsoft Office",
    moduloDescricao: "Word, Excel e PowerPoint essencial",
    videos: [
      { titulo: "Excel 2010 para Concursos - Planilha de Cálculo", url: "https://www.youtube.com/watch?v=rF0eoNNCsQU", duracao: 6, descricao: "Introdução ao Excel, referências de células e operadores para concursos" },
    ],
  },
  {
    materiaNome: "Informática",
    materiaDescricao: "Informática básica para concursos",
    materiaIcone: "monitor",
    materiaCor: "#8B5CF6",
    moduloTitulo: "Questões Cesgranrio",
    moduloDescricao: "Questões de informática da banca Cesgranrio",
    videos: [
      { titulo: "Desafios Banca Cesgranrio - Informática", url: "https://www.youtube.com/watch?v=MhAg91I7ing", duracao: 30, descricao: "Resolução de questões de informática da banca Cesgranrio para Caixa Econômica" },
    ],
  },
  // === Conhecimentos Específicos ===
  {
    materiaNome: "Conhecimentos Específicos - Administração",
    materiaDescricao: "Administração geral e pública",
    materiaIcone: "briefcase",
    materiaCor: "#F59E0B",
    moduloTitulo: "Administração Geral",
    moduloDescricao: "Teoria geral da administração",
    videos: [
      { titulo: "Administração para Concursos 2025 - Domine e Gabarite", url: "https://www.youtube.com/watch?v=eUoH7Poesbo", duracao: 87, descricao: "Aula completa de administração para concursos com Prof. Giovanna Carranza" },
    ],
  },
  {
    materiaNome: "Conhecimentos Específicos - Administração",
    materiaDescricao: "Administração geral e pública",
    materiaIcone: "briefcase",
    materiaCor: "#F59E0B",
    moduloTitulo: "Administração Pública",
    moduloDescricao: "Administração pública para concursos",
    videos: [
      { titulo: "Reta Final - Administração Pública", url: "https://www.youtube.com/watch?v=iJ35sP9bsJM", duracao: 225, descricao: "Revisão completa de administração pública para concursos - Prof. Elisabete Moreira" },
      { titulo: "Administração Geral e Pública - STM", url: "https://www.youtube.com/watch?v=yTYVEVRxzjE", duracao: 213, descricao: "Reta final de administração geral e pública para concursos públicos" },
    ],
  },
  {
    materiaNome: "Conhecimentos Específicos - Administração",
    materiaDescricao: "Administração geral e pública",
    materiaIcone: "briefcase",
    materiaCor: "#F59E0B",
    moduloTitulo: "Planejamento de Estudos",
    moduloDescricao: "Estratégias de planejamento para concursos",
    videos: [
      { titulo: "Concurso Petrobras - Planejamento de Estudos", url: "https://www.youtube.com/watch?v=9C_I7_oXUUg", duracao: 104, descricao: "Como planejar seus estudos para o concurso Petrobras e Transpetro" },
      { titulo: "Tudo sobre Técnico em Operação - Petrobras", url: "https://www.youtube.com/watch?v=p5jqW3u_pyI", duracao: 14, descricao: "Informações completas sobre o cargo de técnico em operação Petrobras" },
      { titulo: "Tudo sobre Concurso Petrobras 2025", url: "https://www.youtube.com/watch?v=xcRaxhxtO_o", duracao: 27, descricao: "Todas as informações sobre o próximo concurso da Petrobras" },
    ],
  },
];

async function ensureMateria(
  nome: string,
  descricao: string,
  icone: string,
  cor: string,
  onLog: LogCallback
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("materias")
    .select("id")
    .eq("nome", nome)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: maxOrdem } = await supabase
    .from("materias")
    .select("ordem")
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrdem = (maxOrdem?.ordem ?? 0) + 1;

  const { data, error } = await supabase
    .from("materias")
    .insert({ nome, descricao, icone, cor, ordem: nextOrdem, ativo: true })
    .select("id")
    .single();

  if (error) {
    onLog({ message: `❌ Erro ao criar matéria "${nome}": ${error.message}`, type: "error" });
    return null;
  }
  onLog({ message: `🆕 Matéria "${nome}" criada automaticamente`, type: "success" });
  return data.id;
}

async function ensureModulo(
  titulo: string,
  descricao: string,
  materiaId: string,
  onLog: LogCallback
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("modulos")
    .select("id")
    .eq("materia_id", materiaId)
    .eq("titulo", titulo)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: maxOrdem } = await supabase
    .from("modulos")
    .select("ordem")
    .eq("materia_id", materiaId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrdem = (maxOrdem?.ordem ?? 0) + 1;

  const { data, error } = await supabase
    .from("modulos")
    .insert({ titulo, descricao, materia_id: materiaId, ordem: nextOrdem, ativo: true })
    .select("id")
    .single();

  if (error) {
    onLog({ message: `❌ Erro ao criar módulo "${titulo}": ${error.message}`, type: "error" });
    return null;
  }
  onLog({ message: `🆕 Módulo "${titulo}" criado automaticamente`, type: "success" });
  return data.id;
}

export async function seedYouTubeVideos(onLog: LogCallback): Promise<boolean> {
  onLog({ message: "🎬 Iniciando seed de vídeos do YouTube...", type: "info" });
  let created = 0;
  let skipped = 0;
  let errors = 0;

  // Cache materia IDs
  const materiaCache = new Map<string, string>();

  for (const group of VIDEO_DATA) {
    // Ensure materia exists
    let materiaId = materiaCache.get(group.materiaNome);
    if (!materiaId) {
      const id = await ensureMateria(
        group.materiaNome,
        group.materiaDescricao,
        group.materiaIcone,
        group.materiaCor,
        onLog
      );
      if (!id) { errors++; continue; }
      materiaCache.set(group.materiaNome, id);
      materiaId = id;
    }

    // Ensure modulo exists
    const moduloId = await ensureModulo(group.moduloTitulo, group.moduloDescricao, materiaId, onLog);
    if (!moduloId) { errors++; continue; }

    for (let i = 0; i < group.videos.length; i++) {
      const video = group.videos[i];
      const videoId = extractYouTubeId(video.url);

      // Check duplicate by URL
      const { data: existing } = await supabase
        .from("conteudos")
        .select("id")
        .eq("modulo_id", moduloId)
        .eq("video_url", video.url)
        .maybeSingle();

      if (existing) {
        onLog({ message: `⏭️ "${video.titulo}" já existe, pulando...`, type: "info" });
        skipped++;
        continue;
      }

      const { error } = await supabase.from("conteudos").insert({
        modulo_id: moduloId,
        titulo: video.titulo,
        descricao: video.descricao,
        tipo: "video",
        video_url: video.url,
        video_thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null,
        duracao_minutos: video.duracao,
        ordem: i + 1,
        ativo: true,
      });

      if (error) {
        onLog({ message: `❌ Erro: "${video.titulo}": ${error.message}`, type: "error" });
        errors++;
        continue;
      }
      onLog({ message: `✅ "${video.titulo}" → ${group.moduloTitulo}`, type: "success" });
      created++;
    }
  }

  onLog({ message: `\n📊 Resultado: ${created} criados, ${skipped} já existiam, ${errors} erros`, type: "info" });
  return errors === 0;
}
