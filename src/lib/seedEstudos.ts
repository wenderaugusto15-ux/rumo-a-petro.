import { supabase } from "@/integrations/supabase/client";

export interface SeedLog {
  message: string;
  type: "info" | "success" | "error";
}

type LogCallback = (log: SeedLog) => void;

const MATERIAS_DATA = [
  { nome: "Língua Portuguesa", descricao: "Gramática, interpretação e redação", icone: "book-open", cor: "#3B82F6", ordem: 1 },
  { nome: "Matemática", descricao: "Raciocínio lógico e matemática aplicada", icone: "calculator", cor: "#EF4444", ordem: 2 },
  { nome: "Conhecimentos Gerais", descricao: "Atualidades e conhecimentos gerais", icone: "globe", cor: "#10B981", ordem: 3 },
  { nome: "Informática", descricao: "Informática básica para concursos", icone: "monitor", cor: "#8B5CF6", ordem: 4 },
  { nome: "Conhecimentos Específicos - Administração", descricao: "Administração geral e pública", icone: "briefcase", cor: "#F59E0B", ordem: 5 },
  { nome: "Ciência de Dados", descricao: "Fundamentos de ciência de dados e analytics", icone: "database", cor: "#06B6D4", ordem: 6 },
  { nome: "Administração", descricao: "Teoria Geral da Administração, Gestão de Pessoas e Processos", icone: "BookOpen", cor: "#8B5CF6", ordem: 7 },
  { nome: "Atualidades", descricao: "Acontecimentos atuais do Brasil e do Mundo", icone: "Newspaper", cor: "#EC4899", ordem: 8 },
  { nome: "Contabilidade", descricao: "Contabilidade Geral, Custos e Análise de Balanços", icone: "Calculator", cor: "#14B8A6", ordem: 9 },
  { nome: "Engenharia de Petróleo", descricao: "Exploração, Produção e Processamento de Petróleo", icone: "Fuel", cor: "#F97316", ordem: 10 },
  { nome: "Engenharia Elétrica", descricao: "Circuitos, Sistemas de Potência e Eletromagnetismo", icone: "Zap", cor: "#EAB308", ordem: 11 },
  { nome: "Engenharia Mecânica", descricao: "Mecânica dos Fluidos, Termodinâmica e Resistência dos Materiais", icone: "Cog", cor: "#6366F1", ordem: 12 },
  { nome: "Geologia", descricao: "Geologia Geral, Sedimentar e Estrutural", icone: "Mountain", cor: "#84CC16", ordem: 13 },
  { nome: "Língua Inglesa", descricao: "Inglês Técnico e Interpretação de Textos em Inglês", icone: "Globe", cor: "#0EA5E9", ordem: 14 },
  { nome: "Meio Ambiente", descricao: "Gestão Ambiental, Sustentabilidade e Legislação", icone: "Leaf", cor: "#22C55E", ordem: 15 },
  { nome: "Segurança do Trabalho", descricao: "NRs, Prevenção de Acidentes e Saúde Ocupacional", icone: "ShieldCheck", cor: "#EF4444", ordem: 16 },
  { nome: "Técnico de Manutenção Mecânica", descricao: "Manutenção Industrial, Lubrificação e Equipamentos", icone: "Wrench", cor: "#78716C", ordem: 17 },
  { nome: "Técnico de Operação", descricao: "Operação de Plantas, Processos e Equipamentos Industriais", icone: "Settings", cor: "#0891B2", ordem: 18 },
];

const MODULOS_DATA: Record<string, { titulo: string; descricao: string; ordem: number }[]> = {
  "Língua Portuguesa": [
    { titulo: "Interpretação de Texto", descricao: "Compreensão e interpretação de textos diversos", ordem: 1 },
    { titulo: "Gramática Essencial", descricao: "Concordância, regência, crase e pontuação", ordem: 2 },
    { titulo: "Redação Oficial", descricao: "Estrutura e padrões de documentos oficiais", ordem: 3 },
    { titulo: "Semântica e Coesão", descricao: "Significado das palavras e conectivos textuais", ordem: 4 },
  ],
  "Matemática": [
    { titulo: "Razão e Proporção", descricao: "Conceitos fundamentais de razão e proporção", ordem: 1 },
    { titulo: "Porcentagem", descricao: "Cálculos de porcentagem para concursos", ordem: 2 },
    { titulo: "Regra de Três", descricao: "Regra de três simples e composta", ordem: 3 },
    { titulo: "Estatística Básica", descricao: "Média, moda, mediana e desvio padrão", ordem: 4 },
    { titulo: "Matemática Financeira", descricao: "Juros simples e compostos", ordem: 5 },
  ],
  "Conhecimentos Gerais": [
    { titulo: "Atualidades Brasil", descricao: "Principais acontecimentos nacionais", ordem: 1 },
    { titulo: "Atualidades Mundo", descricao: "Cenário internacional e geopolítica", ordem: 2 },
    { titulo: "Meio Ambiente e Energia", descricao: "Sustentabilidade e matriz energética", ordem: 3 },
  ],
  "Informática": [
    { titulo: "Windows e Linux", descricao: "Sistemas operacionais para concursos", ordem: 1 },
    { titulo: "Microsoft Office", descricao: "Word, Excel e PowerPoint essencial", ordem: 2 },
    { titulo: "Internet e Segurança", descricao: "Navegadores, e-mail e segurança digital", ordem: 3 },
  ],
  "Conhecimentos Específicos - Administração": [
    { titulo: "Fundamentos de Administração", descricao: "Teoria geral da administração", ordem: 1 },
    { titulo: "Gestão de Pessoas", descricao: "RH, liderança e comportamento organizacional", ordem: 2 },
    { titulo: "Gestão de Projetos", descricao: "PMBOK e metodologias ágeis", ordem: 3 },
    { titulo: "Logística e Supply Chain", descricao: "Cadeia de suprimentos e materiais", ordem: 4 },
    { titulo: "Contabilidade Básica", descricao: "Conceitos contábeis para administradores", ordem: 5 },
  ],
  "Ciência de Dados": [
    { titulo: "Fundamentos de Dados", descricao: "Conceitos básicos de ciência de dados", ordem: 1 },
    { titulo: "Estatística Aplicada", descricao: "Estatística para análise de dados", ordem: 2 },
    { titulo: "Python para Dados", descricao: "Pandas, NumPy e visualização", ordem: 3 },
    { titulo: "Machine Learning Básico", descricao: "Conceitos introdutórios de ML", ordem: 4 },
    { titulo: "SQL e Bancos de Dados", descricao: "Consultas e manipulação de dados", ordem: 5 },
  ],
  "Administração": [
    { titulo: "Teoria Geral da Administração", descricao: "Escolas administrativas e evolução do pensamento", ordem: 1 },
    { titulo: "Gestão de Pessoas", descricao: "Recrutamento, seleção, treinamento e desenvolvimento", ordem: 2 },
    { titulo: "Gestão de Processos", descricao: "Mapeamento, análise e melhoria de processos", ordem: 3 },
    { titulo: "Comportamento Organizacional", descricao: "Cultura, clima e motivação nas organizações", ordem: 4 },
    { titulo: "Planejamento Estratégico", descricao: "Missão, visão, valores e análise SWOT", ordem: 5 },
  ],
  "Atualidades": [
    { titulo: "Brasil Atual", descricao: "Política, economia e sociedade brasileira", ordem: 1 },
    { titulo: "Cenário Internacional", descricao: "Geopolítica e relações internacionais", ordem: 2 },
    { titulo: "Petróleo e Energia", descricao: "Mercado de petróleo e matriz energética", ordem: 3 },
  ],
  "Contabilidade": [
    { titulo: "Contabilidade Geral", descricao: "Princípios contábeis e demonstrações financeiras", ordem: 1 },
    { titulo: "Contabilidade de Custos", descricao: "Custeio, formação de preços e análise", ordem: 2 },
    { titulo: "Análise de Balanços", descricao: "Indicadores financeiros e econômicos", ordem: 3 },
  ],
  "Engenharia de Petróleo": [
    { titulo: "Geologia do Petróleo", descricao: "Formação, migração e acumulação de hidrocarbonetos", ordem: 1 },
    { titulo: "Perfuração", descricao: "Técnicas de perfuração e completação de poços", ordem: 2 },
    { titulo: "Produção de Petróleo", descricao: "Métodos de elevação e recuperação", ordem: 3 },
    { titulo: "Processamento", descricao: "Tratamento e refino de petróleo", ordem: 4 },
    { titulo: "Reservatórios", descricao: "Caracterização e simulação de reservatórios", ordem: 5 },
  ],
  "Engenharia Elétrica": [
    { titulo: "Circuitos Elétricos", descricao: "Análise de circuitos CC e CA", ordem: 1 },
    { titulo: "Máquinas Elétricas", descricao: "Transformadores, motores e geradores", ordem: 2 },
    { titulo: "Sistemas de Potência", descricao: "Geração, transmissão e distribuição", ordem: 3 },
    { titulo: "Eletrônica de Potência", descricao: "Conversores e controladores", ordem: 4 },
    { titulo: "Instrumentação", descricao: "Sensores, medição e controle", ordem: 5 },
  ],
  "Engenharia Mecânica": [
    { titulo: "Mecânica dos Fluidos", descricao: "Estática e dinâmica dos fluidos", ordem: 1 },
    { titulo: "Termodinâmica", descricao: "Leis da termodinâmica e ciclos", ordem: 2 },
    { titulo: "Resistência dos Materiais", descricao: "Tensões, deformações e dimensionamento", ordem: 3 },
    { titulo: "Elementos de Máquinas", descricao: "Engrenagens, eixos, rolamentos", ordem: 4 },
    { titulo: "Transferência de Calor", descricao: "Condução, convecção e radiação", ordem: 5 },
  ],
  "Geologia": [
    { titulo: "Geologia Geral", descricao: "Minerais, rochas e processos geológicos", ordem: 1 },
    { titulo: "Geologia Estrutural", descricao: "Dobras, falhas e deformações", ordem: 2 },
    { titulo: "Geologia Sedimentar", descricao: "Ambientes deposicionais e estratigrafia", ordem: 3 },
    { titulo: "Geofísica", descricao: "Métodos sísmicos e perfilagem", ordem: 4 },
  ],
  "Técnico de Operação": [
    { titulo: "Processos Industriais", descricao: "Operações unitárias e fluxogramas", ordem: 1 },
    { titulo: "Instrumentação Industrial", descricao: "Malhas de controle e instrumentos", ordem: 2 },
    { titulo: "Operação de Equipamentos", descricao: "Bombas, compressores, trocadores", ordem: 3 },
    { titulo: "Segurança Operacional", descricao: "Procedimentos e análise de riscos", ordem: 4 },
    { titulo: "Química Aplicada", descricao: "Fundamentos químicos para operação", ordem: 5 },
  ],
  "Técnico de Manutenção Mecânica": [
    { titulo: "Manutenção Industrial", descricao: "Preventiva, preditiva e corretiva", ordem: 1 },
    { titulo: "Lubrificação", descricao: "Tipos de lubrificantes e aplicações", ordem: 2 },
    { titulo: "Equipamentos Rotativos", descricao: "Bombas, compressores, turbinas", ordem: 3 },
    { titulo: "Equipamentos Estáticos", descricao: "Vasos, torres, trocadores", ordem: 4 },
    { titulo: "Metrologia", descricao: "Instrumentos de medição e calibração", ordem: 5 },
  ],
};

export async function seedMaterias(onLog: LogCallback): Promise<boolean> {
  onLog({ message: "Iniciando seed de matérias...", type: "info" });
  let created = 0;
  let skipped = 0;

  for (const materia of MATERIAS_DATA) {
    const { data: existing } = await supabase
      .from("materias")
      .select("id")
      .eq("nome", materia.nome)
      .maybeSingle();

    if (existing) {
      onLog({ message: `⏭️ Matéria "${materia.nome}" já existe, pulando...`, type: "info" });
      skipped++;
      continue;
    }

    const { error } = await supabase.from("materias").insert(materia);
    if (error) {
      onLog({ message: `❌ Erro ao criar "${materia.nome}": ${error.message}`, type: "error" });
      return false;
    }
    onLog({ message: `✅ Matéria "${materia.nome}" criada`, type: "success" });
    created++;
  }

  onLog({ message: `\nMatérias: ${created} criadas, ${skipped} já existiam`, type: "info" });
  return true;
}

export async function seedModulos(onLog: LogCallback): Promise<boolean> {
  onLog({ message: "\nIniciando seed de módulos...", type: "info" });
  let created = 0;
  let skipped = 0;

  const { data: materias } = await supabase.from("materias").select("id, nome");
  if (!materias) {
    onLog({ message: "❌ Nenhuma matéria encontrada. Execute o seed de matérias primeiro.", type: "error" });
    return false;
  }

  const materiaMap = new Map(materias.map((m) => [m.nome, m.id]));

  for (const [materiaNome, modulos] of Object.entries(MODULOS_DATA)) {
    const materiaId = materiaMap.get(materiaNome);
    if (!materiaId) {
      onLog({ message: `⚠️ Matéria "${materiaNome}" não encontrada no banco, pulando módulos...`, type: "error" });
      continue;
    }

    for (const modulo of modulos) {
      const { data: existing } = await supabase
        .from("modulos")
        .select("id")
        .eq("materia_id", materiaId)
        .eq("titulo", modulo.titulo)
        .maybeSingle();

      if (existing) {
        onLog({ message: `⏭️ Módulo "${modulo.titulo}" já existe em "${materiaNome}"`, type: "info" });
        skipped++;
        continue;
      }

      const { error } = await supabase.from("modulos").insert({
        ...modulo,
        materia_id: materiaId,
        ativo: true,
      });

      if (error) {
        onLog({ message: `❌ Erro ao criar módulo "${modulo.titulo}": ${error.message}`, type: "error" });
        return false;
      }
      onLog({ message: `✅ Módulo "${modulo.titulo}" criado em "${materiaNome}"`, type: "success" });
      created++;
    }
  }

  onLog({ message: `\nMódulos: ${created} criados, ${skipped} já existiam`, type: "info" });
  return true;
}

export async function seedConteudos(onLog: LogCallback): Promise<boolean> {
  onLog({ message: "\nIniciando seed de conteúdos de exemplo...", type: "info" });
  let created = 0;
  let skipped = 0;

  const { data: modulos } = await supabase.from("modulos").select("id, titulo, materia_id");
  if (!modulos || modulos.length === 0) {
    onLog({ message: "❌ Nenhum módulo encontrado. Execute o seed de módulos primeiro.", type: "error" });
    return false;
  }

  for (const modulo of modulos) {
    // Create one sample text content per module
    const titulo = `Resumo: ${modulo.titulo}`;
    const { data: existing } = await supabase
      .from("conteudos")
      .select("id")
      .eq("modulo_id", modulo.id)
      .eq("titulo", titulo)
      .maybeSingle();

    if (existing) {
      onLog({ message: `⏭️ Conteúdo "${titulo}" já existe`, type: "info" });
      skipped++;
      continue;
    }

    const { error } = await supabase.from("conteudos").insert({
      modulo_id: modulo.id,
      titulo,
      descricao: `Material de estudo sobre ${modulo.titulo}`,
      tipo: "texto",
      conteudo_texto: `<h2>${modulo.titulo}</h2><p>Conteúdo de estudo para o concurso Petrobras (Cesgranrio). Este é um material introdutório sobre o tema.</p><p>Estude com atenção e faça anotações!</p>`,
      ordem: 1,
      ativo: true,
    });

    if (error) {
      onLog({ message: `❌ Erro ao criar conteúdo "${titulo}": ${error.message}`, type: "error" });
      return false;
    }
    onLog({ message: `✅ Conteúdo "${titulo}" criado`, type: "success" });
    created++;
  }

  onLog({ message: `\nConteúdos: ${created} criados, ${skipped} já existiam`, type: "info" });
  return true;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

const VIDEO_CONTEUDOS: { moduloTitulo: string; videos: { titulo: string; descricao: string; url: string; duracao: number }[] }[] = [
  {
    moduloTitulo: "Interpretação de Texto",
    videos: [
      { titulo: "Interpretação de Textos - Guia COMPLETO", descricao: "Aula completa sobre técnicas de interpretação de texto para concursos", url: "https://www.youtube.com/watch?v=OxTNN-IKcEQ", duracao: 14 },
      { titulo: "Compreensão e Interpretação - Dicas Imprescindíveis", descricao: "Diferença entre compreender e interpretar textos", url: "https://www.youtube.com/watch?v=45thlAoGOGU", duracao: 13 },
      { titulo: "Informações Literais e Inferências", descricao: "Como identificar informações explícitas e implícitas no texto", url: "https://www.youtube.com/watch?v=O2c8_hjIJks", duracao: 22 },
    ],
  },
  {
    moduloTitulo: "Razão e Proporção",
    videos: [
      { titulo: "Matemática Petrobras - Cesgranrio Sem Travar", descricao: "O que mais cai na Petrobras: porcentagem, proporção e gráficos", url: "https://www.youtube.com/watch?v=OvfSzqWzNME", duracao: 18 },
      { titulo: "Resolução Prova Transpetro 2018 - Matemática", descricao: "Resolução completa da prova de matemática nível técnico", url: "https://www.youtube.com/watch?v=zRlIKk--gBs", duracao: 103 },
    ],
  },
  {
    moduloTitulo: "Porcentagem",
    videos: [
      { titulo: "Matemática para Petrobras - Banca Cesgranrio", descricao: "Tópicos mais recorrentes: porcentagem, regra de três e estatística", url: "https://www.youtube.com/watch?v=INSIRA_VIDEO_ID", duracao: 30 },
    ],
  },
  {
    moduloTitulo: "Fundamentos de Administração",
    videos: [
      { titulo: "Concurso Petrobras 2025 - Tudo que você precisa saber", descricao: "Informações completas sobre o concurso, cargos e preparação", url: "https://www.youtube.com/watch?v=xcRaxhxtO_o", duracao: 27 },
    ],
  },
];

export async function seedVideoConteudos(onLog: LogCallback): Promise<boolean> {
  onLog({ message: "\nIniciando seed de conteúdos de vídeo...", type: "info" });
  let created = 0;
  let skipped = 0;

  const { data: modulos } = await supabase.from("modulos").select("id, titulo");
  if (!modulos || modulos.length === 0) {
    onLog({ message: "❌ Nenhum módulo encontrado. Execute o seed de módulos primeiro.", type: "error" });
    return false;
  }

  const moduloMap = new Map(modulos.map((m) => [m.titulo, m.id]));

  for (const group of VIDEO_CONTEUDOS) {
    const moduloId = moduloMap.get(group.moduloTitulo);
    if (!moduloId) {
      onLog({ message: `⚠️ Módulo "${group.moduloTitulo}" não encontrado, pulando...`, type: "error" });
      continue;
    }

    for (let i = 0; i < group.videos.length; i++) {
      const video = group.videos[i];
      const videoId = extractYouTubeId(video.url);

      const { data: existing } = await supabase
        .from("conteudos")
        .select("id")
        .eq("modulo_id", moduloId)
        .eq("video_url", video.url)
        .maybeSingle();

      if (existing) {
        onLog({ message: `⏭️ Vídeo "${video.titulo}" já existe`, type: "info" });
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
        ordem: i + 10, // offset to not clash with text content at ordem=1
        ativo: true,
      });

      if (error) {
        onLog({ message: `❌ Erro ao criar vídeo "${video.titulo}": ${error.message}`, type: "error" });
        return false;
      }
      onLog({ message: `✅ Vídeo "${video.titulo}" criado em "${group.moduloTitulo}"`, type: "success" });
      created++;
    }
  }

  onLog({ message: `\nVídeos: ${created} criados, ${skipped} já existiam`, type: "info" });
  return true;
}
