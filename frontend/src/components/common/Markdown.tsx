import React from "react";

/**
 * Lightweight markdown renderer for AI chat messages.
 * Handles: **bold**, *italic*, `code`, headings (#), bullet lists (- / •), numbered lists, horizontal rules (---), and line breaks.
 */

// Parse inline formatting within a single line of text
function renderInline(text: string, key?: string | number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Matches **bold**, *italic*, `code` in order
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push plain text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // **bold**
      parts.push(<strong key={`${key}-b-${match.index}`} style={{ fontWeight: 700, color: "inherit" }}>{match[2]}</strong>);
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={`${key}-i-${match.index}`} style={{ fontStyle: "italic" }}>{match[4]}</em>);
    } else if (match[5]) {
      // `code`
      parts.push(
        <code key={`${key}-c-${match.index}`} style={{
          fontFamily: "monospace", fontSize: "0.88em",
          background: "rgba(99,102,241,0.15)", borderRadius: 4,
          padding: "1px 5px", color: "#a5b4fc",
        }}>
          {match[6]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Remaining plain text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <React.Fragment key={key}>{parts}</React.Fragment>;
}

interface MarkdownProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Markdown({ content, className, style }: MarkdownProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // ── Horizontal rule ───────────────────────────────────────
    if (/^---+$/.test(trimmed)) {
      elements.push(
        <hr key={i} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />
      );
      i++;
      continue;
    }

    // ── Heading # / ## / ### ──────────────────────────────────
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizes = [18, 15, 13.5];
      elements.push(
        <div key={i} style={{
          fontSize: sizes[level - 1] ?? 13.5,
          fontWeight: 700,
          marginTop: level === 1 ? 16 : 10,
          marginBottom: 4,
          color: "var(--text-primary)",
        }}>
          {renderInline(headingMatch[2], i)}
        </div>
      );
      i++;
      continue;
    }

    // ── Bullet list: lines starting with - / • / * ─────────────
    if (/^[-•*]\s+/.test(trimmed)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^[-•*]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-•*]\s+/, "");
        listItems.push(
          <li key={i} style={{ marginBottom: 3, paddingLeft: 4 }}>
            {renderInline(itemText, `li-${i}`)}
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{
          paddingLeft: 18, margin: "6px 0",
          listStyleType: "disc", lineHeight: 1.7,
        }}>
          {listItems}
        </ul>
      );
      continue;
    }

    // ── Numbered list: lines starting with 1. 2. etc ──────────
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
        listItems.push(
          <li key={i} style={{ marginBottom: 3, paddingLeft: 4 }}>
            {renderInline(itemText, `ol-${i}`)}
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{
          paddingLeft: 20, margin: "6px 0",
          listStyleType: "decimal", lineHeight: 1.7,
        }}>
          {listItems}
        </ol>
      );
      continue;
    }

    // ── Blank line → paragraph spacer ─────────────────────────
    if (trimmed === "") {
      // Only add spacer if previous element wasn't already a spacer
      const last = elements[elements.length - 1];
      if (last && (last as React.ReactElement)?.key !== `gap-${i - 1}`) {
        elements.push(<div key={`gap-${i}`} style={{ height: 8 }} />);
      }
      i++;
      continue;
    }

    // ── Normal paragraph line ──────────────────────────────────
    elements.push(
      <div key={i} style={{ lineHeight: 1.75, marginBottom: 1 }}>
        {renderInline(trimmed, i)}
      </div>
    );
    i++;
  }

  return (
    <div className={className} style={{ fontSize: 13.5, ...style }}>
      {elements}
    </div>
  );
}
