export interface BaseSeoSection {
  h2: string;
  paragraphs: string[];
}

export interface BaseSeoFaq {
  question: string;
  answer: string;
}

export interface BaseSeoPage {
  id: string;
  slug: string;
  keyword: string;
  category: string;
  region_label: string | null;
  title: string;
  h1: string;
  description: string;
  meta_keywords: string[];
  hero_kicker: string | null;
  hero_subtitle: string | null;
  sections: BaseSeoSection[];
  faqs: BaseSeoFaq[];
  cta_text: string | null;
  image_url: string | null;
  publish_source: "web" | "local";
  hidden: boolean;
  created_at: string;
  updated_at: string;
}

export type BaseSeoInsert = Omit<
  BaseSeoPage,
  "id" | "created_at" | "updated_at" | "hidden"
> & { hidden?: boolean };
