/**
 * Shows text written in the admin panel with its formatting preserved:
 *   - a blank line starts a new paragraph
 *   - lines starting with "- ", "* " or "• " become a bullet list
 *   - single line breaks inside a paragraph stay as line breaks
 * Nothing is rendered as HTML, so pasted markup is shown as plain text (safe against injected scripts).
 */
const BULLET = /^\s*(?:[-*•–])\s+(.*)$/;

export function parseFormatted(text) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = []; // { type: 'p', lines: [] } | { type: 'ul', items: [] }

  let current = null;
  function flush() {
    if (current) blocks.push(current);
    current = null;
  }

  for (const line of lines) {
    if (!line.trim()) {
      flush();
      continue;
    }
    const bullet = line.match(BULLET);
    if (bullet) {
      if (!current || current.type !== 'ul') {
        flush();
        current = { type: 'ul', items: [] };
      }
      current.items.push(bullet[1]);
    } else {
      if (!current || current.type !== 'p') {
        flush();
        current = { type: 'p', lines: [] };
      }
      current.lines.push(line.trim());
    }
  }
  flush();
  return blocks;
}

export default function FormattedText({ text, className = '' }) {
  const blocks = parseFormatted(text);
  if (!blocks.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, i) =>
        block.type === 'ul' ? (
          <ul key={i} className="mb-3">
            {block.items.map((item, j) => <li key={j}>{item}</li>)}
          </ul>
        ) : (
          <p key={i} className="mb-3">
            {block.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        )
      )}
    </div>
  );
}
