/** Origin API for a normalized article, per docs/PRODUCT_SPEC.md section 3. */
export type ArticleSource = 'devto' | 'mslearn' | 'hackernews' | 'hashnode' | 'github';

/** Engagement metric normalized per source (points, stars, reactions, etc.). */
export interface ArticleMetric {
  label: string;
  value: number;
}

/** Single normalized shape all 5 source APIs are mapped into before reaching the UI layer. */
export interface UnifiedArticle {
  id: string;
  source: ArticleSource;
  title: string;
  url: string;
  summary: string | null;
  author: string | null;
  publishedAt: string | null;
  tags: string[];
  thumbnailUrl: string | null;
  metric: ArticleMetric | null;
}
