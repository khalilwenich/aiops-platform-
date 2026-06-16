export function buildMRCommentPrompt(analysis) {
  return `Tu es un expert DevOps. Génère une explication courte (3 phrases maximum) en français
destinée à un développeur non-DevOps sur pourquoi ce pipeline a échoué et comment corriger rapidement.

Type d'erreur : ${analysis.errorType}
Cause racine : ${analysis.rootCause}
Résumé : ${analysis.summary || ''}
Premier fix suggéré : ${analysis.suggestedFixes?.[0]?.description || 'Aucun'}

Réponds uniquement avec les 3 phrases. Pas de markdown, pas de listes.`;
}
