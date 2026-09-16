import { ArticleSource } from './article.model';

export type FeedLoadStatus = 'idle' | 'loading' | 'loaded';

export interface FeedFilterState {
  selectedSources: ArticleSource[];
  selectedTags: string[];
}