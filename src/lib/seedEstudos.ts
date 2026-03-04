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
