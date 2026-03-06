/**
 * Validates whether a content record has real, meaningful content.
 * Used globally to hide empty/placeholder materials from users.
 */

const PLACEHOLDER_PATTERNS = [
  'Material de estudo sobre',
  'Conteúdo em breve',
  'Em construção',
  'Lorem ipsum',
  'Texto placeholder',
  'Conteúdo será adicionado',
  'Em desenvolvimento',
  'A ser definido',
];

/** Check if a text string represents valid, non-placeholder content */
export function hasValidText(text: string | null | undefined): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 150) return false;
  return !PLACEHOLDER_PATTERNS.some(p => trimmed.toLowerCase().includes(p.toLowerCase()));
}

/** Check if a conteudo record has real content based on its type */
export function hasValidContent(conteudo: {
  tipo: string;
  video_url?: string | null;
  conteudo_texto?: string | null;
  pdf_url?: string | null;
}): boolean {
  if (conteudo.tipo === "video" && conteudo.video_url) return true;
  if (conteudo.tipo === "texto") return hasValidText(conteudo.conteudo_texto);
  if (conteudo.tipo === "pdf" && conteudo.pdf_url) return true;
  return false;
}
