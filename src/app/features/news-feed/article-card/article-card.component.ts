import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { UnifiedArticle } from '../../../models/article.model';

const SOURCE_STYLES: Record<UnifiedArticle['source'], { label: string; bar: string; text: string }> = {
  devto: { label: 'Dev.to', bar: 'bg-devto', text: 'text-devto' },
  mslearn: { label: 'Microsoft Learn', bar: 'bg-mslearn', text: 'text-mslearn' },
  hackernews: { label: 'Hacker News', bar: 'bg-hackernews', text: 'text-hackernews' },
  hashnode: { label: 'Hashnode', bar: 'bg-cyan', text: 'text-cyan' },
  github: { label: 'GitHub', bar: 'bg-github', text: 'text-github' },
};

@Component({
  selector: 'app-article-card',
  imports: [DatePipe, NgOptimizedImage],
  templateUrl: './article-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleCardComponent {
  readonly article = input.required<UnifiedArticle>();
  readonly isFavorite = input(false);
  readonly favoriteToggled = output<UnifiedArticle>();

  sourceLabel(source: UnifiedArticle['source']): string {
    return SOURCE_STYLES[source].label;
  }

  sourceBarClass(): string {
    return SOURCE_STYLES[this.article().source].bar;
  }

  sourceTextClass(): string {
    return SOURCE_STYLES[this.article().source].text;
  }
}
