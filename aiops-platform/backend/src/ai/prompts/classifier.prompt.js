export function buildClassifierPrompt(errorText) {
  return `Classify this CI/CD error into one of these categories: build_failure, test_failure, dependency_issue, security_vulnerability, unknown.

Error text:
${errorText}

Respond with JSON only: { "errorType": "...", "confidence": 0.0, "reason": "..." }`;
}
