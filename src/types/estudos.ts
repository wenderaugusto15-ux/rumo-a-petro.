export interface Materia {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string | null;
  cor: string | null;
  ordem: number | null;
  ativo: boolean | null;
  created_at: string | null;
}

export interface Modulo {
  id: string;
  materia_id: string | null;
  titulo: string;
  descricao: string | null;
  ordem: number | null;
  ativo: boolean | null;
  created_at: string | null;
}

export interface Conteudo {
  id: string;
  modulo_id: string | null;
  tipo: string;
  titulo: string;
  descricao: string | null;
  video_url: string | null;
  conteudo_texto: string | null;
  pdf_url: string | null;
  video_thumbnail: string | null;
  duracao_minutos: number | null;
  ordem: number | null;
  ativo: boolean | null;
  created_at: string | null;
}

export interface ProgressoEstudo {
  id: string;
  user_id: string | null;
  conteudo_id: string | null;
  concluido: boolean | null;
  tempo_assistido: number | null;
  anotacoes: string | null;
  data_inicio: string | null;
  data_conclusao: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ModuloComConteudos extends Modulo {
  conteudos: Conteudo[];
}

export interface MateriaComProgresso extends Materia {
  totalConteudos: number;
  conteudosConcluidos: number;
  percentualProgresso: number;
}
