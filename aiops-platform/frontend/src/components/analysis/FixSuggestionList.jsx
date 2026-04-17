import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Terminal, Code } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import clsx from 'clsx';

const PRIORITY_CONFIG = {
  high: { variant: 'danger', border: 'border-l-red-500', glow: 'shadow-red-900/20' },
  medium: { variant: 'warning', border: 'border-l-yellow-500', glow: 'shadow-yellow-900/20' },
  low: { variant: 'info', border: 'border-l-blue-500', glow: 'shadow-blue-900/20' },
};

function CodeBlock({ code, language = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="code-block text-sm overflow-x-auto whitespace-pre-wrap break-words max-h-48">
        {code}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-surface-2 border border-border opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-success" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-text-muted" />
        )}
      </button>
    </div>
  );
}

function FixItem({ fix, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const config = PRIORITY_CONFIG[fix.priority] || PRIORITY_CONFIG.low;

  return (
    <div
      className={clsx(
        'bg-surface-2 rounded-lg border border-border border-l-2 overflow-hidden transition-shadow',
        config.border
      )}
    >
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <Badge variant={config.variant} size="sm">{fix.priority}</Badge>
          <span className="text-sm text-text-primary">{fix.description}</span>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
        )}
      </button>

      {expanded && (fix.command || fix.codeHint) && (
        <div className="px-4 pb-4 space-y-3">
          {fix.command && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs text-text-muted">Command</span>
              </div>
              <CodeBlock code={fix.command} language="bash" />
            </div>
          )}
          {fix.codeHint && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs text-text-muted">Code hint</span>
              </div>
              <CodeBlock code={fix.codeHint} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FixSuggestionList({ fixes = [] }) {
  if (!fixes.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        Suggested Fixes ({fixes.length})
      </h4>
      {fixes.map((fix, i) => (
        <FixItem key={i} fix={fix} index={i} />
      ))}
    </div>
  );
}

export default FixSuggestionList;
