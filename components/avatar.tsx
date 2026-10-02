import { avatarColorVars, initialsOf } from "@/lib/avatar-colors";

export function Avatar({
  name,
  colorId,
  size = 34,
}: {
  name: string;
  /** Rengi belirleyen kimlik (genelde baş öğretmenin kendi id'si). */
  colorId: string;
  size?: number;
}) {
  const { bg, fg } = avatarColorVars(colorId);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        background: bg,
        color: fg,
        fontSize: Math.round(size * 0.36),
      }}
    >
      {initialsOf(name)}
    </span>
  );
}

export function ColorDot({ colorId, size = 8 }: { colorId: string; size?: number }) {
  const { dot } = avatarColorVars(colorId);
  return (
    <span
      className="inline-block shrink-0 rounded-[3px]"
      style={{ width: size, height: size, background: dot }}
    />
  );
}
