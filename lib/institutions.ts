/**
 * Aynı adlı kurumlar olabilir (ayırt eden kimliktir). Ekranda karışmasınlar
 * diye, adı birden fazla kurumda geçiyorsa kimliğin ilk 4 karakteri eklenir:
 * "Kurum A (#3f9c)". Adı benzersiz olan kurumlar olduğu gibi gösterilir.
 */
export function institutionLabels(list: { id: string; name: string }[]): Record<string, string> {
  const counts = new Map<string, number>();
  for (const i of list) counts.set(i.name, (counts.get(i.name) ?? 0) + 1);
  return Object.fromEntries(
    list.map((i) => [i.id, (counts.get(i.name) ?? 0) > 1 ? `${i.name} (#${i.id.slice(0, 4)})` : i.name]),
  );
}
