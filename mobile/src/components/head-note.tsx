import { Pencil } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { AppText, Button, Field, Message } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { usePalette } from "@/theme";

/** Asistan için: baş öğretmen notunu salt okunur gösterir. */
export function HeadNoteReadOnly({ note, title = "Baş öğretmen notu" }: { note: string; title?: string }) {
  const p = usePalette();
  return (
    <View style={{ borderRadius: 10, borderWidth: 1, borderColor: p.line, backgroundColor: p.accentSoft, padding: 10, gap: 2 }}>
      <AppText size={12} weight="medium" tone="accent">
        {title}
      </AppText>
      <AppText>{note}</AppText>
    </View>
  );
}

/** Baş öğretmen için: bir günün kaydındaki notu gösterir, ekler, düzenler. */
export function HeadNoteEditor({
  studentId,
  date,
  initialNote,
  onSaved,
}: {
  studentId: string;
  date: string;
  initialNote: string | null;
  onSaved: () => void;
}) {
  const p = usePalette();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(initialNote ?? "");
  const [draft, setDraft] = useState(initialNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api(`/ogrencilerim/${studentId}/not`, { method: "PUT", body: { date, note: draft.trim() || null } });
      setSaved(draft.trim());
      setEditing(false);
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Not kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <View style={{ gap: 8, borderRadius: 10, borderWidth: 1, borderColor: p.line, backgroundColor: p.surface2, padding: 10 }}>
        <Field label="Baş öğretmen notu" value={draft} onChangeText={setDraft} multiline maxLength={1000} />
        {error ? <Message ok={false} text={error} /> : null}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button label="Kaydet" small onPress={save} loading={busy} />
          <Button
            label="Vazgeç"
            small
            variant="secondary"
            disabled={busy}
            onPress={() => {
              setDraft(saved);
              setError(null);
              setEditing(false);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {saved ? <HeadNoteReadOnly note={saved} /> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saved ? "Notu düzenle" : "Not ekle"}
        onPress={() => {
          setDraft(saved);
          setEditing(true);
        }}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          minHeight: 40,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 12,
          borderRadius: 9,
          borderWidth: 1,
          borderColor: p.line,
          backgroundColor: pressed ? p.sunken : p.surface,
        })}
      >
        <Pencil size={14} color={p.ink2} />
        <AppText size={13} weight="medium" tone="ink2">
          {saved ? "Notu düzenle" : "Not ekle"}
        </AppText>
      </Pressable>
    </View>
  );
}
