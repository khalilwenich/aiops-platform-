export function buildFixSuggesterPrompt(errorType, rootCause, context) {
  return `You are a DevOps expert. Suggest concrete fixes for this CI/CD pipeline issue.

Error Type: ${errorType}
Root Cause: ${rootCause}
Context: ${JSON.stringify(context, null, 2)}

Respond with JSON only:
{
  "fixes": [
    {
      "priority": "high | medium | low",
      "description": "What to do",
      "command": "CLI command or empty string",
      "codeHint": "code snippet or empty string"
    }
  ]
}`;
}
