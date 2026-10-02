const PALETTE_SIZE = 6;

/** Verilen kimliğe (örn. baş öğretmen id'si) 1–6 arası sabit bir renk dilimi atar. */
export function avatarColorSlot(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return (hash % PALETTE_SIZE) + 1;
}

export function avatarColorVars(id: string) {
  const slot = avatarColorSlot(id);
  return {
    bg: `var(--avatar-${slot}-bg)`,
    fg: `var(--avatar-${slot}-fg)`,
    dot: `var(--avatar-${slot}-dot)`,
  };
}

export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
