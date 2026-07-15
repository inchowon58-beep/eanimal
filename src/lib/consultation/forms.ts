/**
 * 상담 신청서 양식 정의 (카테고리별)
 * - 이름/연락처는 모든 양식에 항상 포함되는 고정 필수 항목(폼 컴포넌트에서 직접 렌더).
 * - fields: 관리자가 카테고리별로 추가/편집하는 "추가 입력 항목" (모두 고객 직접 입력).
 * - 관리자 설정(DB)이 있으면 그것을, 없으면 카테고리 기본값을, 그것도 없으면 기본 약식을 사용.
 */

export interface ConsultField {
  id: string;
  label: string;
  required: boolean;
  multiline: boolean;
}

export interface CategoryForm {
  intro: string;
  fields: ConsultField[];
}

const f = (id: string, label: string, required = false, multiline = false): ConsultField => ({
  id,
  label,
  required,
  multiline,
});

/** 카테고리 설정이 전혀 없을 때 쓰는 기본 약식 */
export const DEFAULT_FORM: CategoryForm = {
  intro: "고민 중이신가요? 어떻게 해야 할지 모르겠다면 편하게 상담을 요청해 보세요.",
  fields: [f("content", "상담 요청 내용", false, true)],
};

/** 카테고리별 기본 양식 (관리자가 저장하지 않았을 때 사용) */
const CATEGORY_FORMS: Record<string, CategoryForm> = {
  shelter: {
    intro: "소중한 아이의 안전한 인도를 위해 아래 정보를 남겨 주세요. 배정 상담사가 순차적으로 연락드립니다.",
    fields: [
      f("region", "거주 지역"),
      f("breed", "품종"),
      f("petName", "반려동물 이름"),
      f("sex", "성별"),
      f("age", "나이"),
      f("vaccination", "접종 유무"),
      f("neutering", "중성화 유무"),
      f("character", "성격", false, true),
      f("reason", "파양/인도 신청 사유", true, true),
      f("method", "상담 방식 (전화/카톡/문자)"),
    ],
  },
};

/**
 * 카테고리의 양식을 결정한다.
 * @param categoryId 카테고리 id
 * @param dbForms   DB에 저장된 카테고리별 양식 ({ [categoryId]: CategoryForm })
 */
export function resolveCategoryForm(
  categoryId: string | null | undefined,
  dbForms: Record<string, CategoryForm> = {}
): CategoryForm {
  if (categoryId && dbForms[categoryId]) return dbForms[categoryId];
  if (categoryId && CATEGORY_FORMS[categoryId]) return CATEGORY_FORMS[categoryId];
  return DEFAULT_FORM;
}

/** 카테고리 기본 양식(코드 정의)을 반환 — 관리자 편집기 초기값용 */
export function defaultCategoryForm(categoryId: string | null | undefined): CategoryForm {
  if (categoryId && CATEGORY_FORMS[categoryId]) return CATEGORY_FORMS[categoryId];
  return DEFAULT_FORM;
}

/** 임의 값을 안전한 CategoryForm 으로 정리 */
export function sanitizeForm(value: unknown): CategoryForm | null {
  if (!value || typeof value !== "object") return null;
  const v = value as { intro?: unknown; fields?: unknown };
  const intro = typeof v.intro === "string" ? v.intro : "";
  const fields: ConsultField[] = [];
  if (Array.isArray(v.fields)) {
    for (const item of v.fields) {
      if (!item || typeof item !== "object") continue;
      const it = item as Record<string, unknown>;
      const label = typeof it.label === "string" ? it.label.trim() : "";
      if (!label) continue;
      fields.push({
        id: typeof it.id === "string" && it.id ? it.id : Math.random().toString(36).slice(2, 10),
        label,
        required: Boolean(it.required),
        multiline: Boolean(it.multiline),
      });
    }
  }
  return { intro, fields };
}
