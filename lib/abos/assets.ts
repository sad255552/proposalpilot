export type AssetType =
  | "landing_page"
  | "pricing_page"
  | "lead_magnet"
  | "email_sequence"
  | "social_posts"
  | "cold_email_sequence"
  | "mvp_build_prompt"
  | "product_requirements_doc"
  | "onboarding_flow"
  | "ad_creatives";

export type JsonRecord = Record<string, unknown>;

export type AbosAsset = {
  id: string;
  type: AssetType;
  title: string;
  description: string;
  content: JsonRecord;
  status: string;
  public_url?: string | null;
  created_at?: string | null;
};

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  landing_page: "Landing Page",
  pricing_page: "Pricing Page",
  lead_magnet: "Lead Magnet",
  email_sequence: "Email Sequence",
  social_posts: "Social Posts",
  cold_email_sequence: "Cold Emails",
  mvp_build_prompt: "MVP Build Prompt",
  product_requirements_doc: "PRD",
  onboarding_flow: "Onboarding Flow",
  ad_creatives: "Ad Creatives"
};

const ASSET_TYPES = Object.keys(ASSET_TYPE_LABELS);

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isAssetType(value: unknown): value is AssetType {
  return typeof value === "string" && ASSET_TYPES.includes(value);
}

export function stringFrom(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function listFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

export function normalizeAsset(value: unknown): AbosAsset | null {
  if (!isRecord(value) || !isAssetType(value.type) || typeof value.id !== "string") return null;

  return {
    id: value.id,
    type: value.type,
    title: stringFrom(value.title, ASSET_TYPE_LABELS[value.type]),
    description: stringFrom(value.description),
    content: isRecord(value.content) ? value.content : {},
    status: stringFrom(value.status, "draft"),
    public_url: typeof value.public_url === "string" ? value.public_url : null,
    created_at: typeof value.created_at === "string" ? value.created_at : null
  };
}
