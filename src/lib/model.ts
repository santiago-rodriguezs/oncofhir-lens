/**
 * Returns the Claude model ID.
 * Priority: explicit parameter > CLAUDE_MODEL env var > default (sonnet).
 */
export function getClaudeModel(choice?: string): string {
  const selected = (choice || process.env.CLAUDE_MODEL || 'sonnet').toLowerCase();
  if (selected === 'opus') return 'claude-opus-4-6';
  return 'claude-sonnet-4-6';
}
