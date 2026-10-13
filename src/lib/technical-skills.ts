import { useCollectionData, useDocData } from "./admin-data";

type SkillCategory = { category: string; skills: string[]; createdAt?: number };
const defaultOrder = { technicalSkillCategoryOrder: [] as string[] };

export function useTechnicalSkills() {
  const categories = useCollectionData<SkillCategory>("technicalSkills");
  const order = useDocData("profile", "main", defaultOrder);
  const positions = new Map(order.data.technicalSkillCategoryOrder.map((id, index) => [id, index]));
  // Stable sorting preserves the existing order for categories without a saved position.
  const items = [...categories.items].sort(
    (a, b) => (positions.get(a.id) ?? Infinity) - (positions.get(b.id) ?? Infinity),
  );

  return {
    ...categories,
    items,
    loading: categories.loading || order.loading,
    error: categories.error || order.error,
    saveOrder: (ids: string[]) => order.save({ technicalSkillCategoryOrder: ids }),
  };
}
