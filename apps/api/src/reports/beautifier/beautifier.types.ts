export interface Beautifier {
  name: 'ollama' | 'hf' | 'groq';
  enhance(markdown: string): Promise<string>;
}

export function wrapPrompt(md: string) {
  return `Redacta el siguiente informe técnico en formato Markdown ejecutivo, claro y accionable.
- Mantén bullets y secciones.
- Resalta KPIs clave, riesgos y recomendaciones.

INFORME:
${md}`;
}
