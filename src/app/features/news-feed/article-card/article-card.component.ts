import { ChangeDetectionStrategy, Component, OnInit, input, output } from '@angular/core';
import { UnifiedArticle } from '../../../models/article.model';

@Component({
  selector: 'app-article-card',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleCardComponent implements OnInit {
  readonly article = input.required<UnifiedArticle>();
  readonly isFavorite = input(false);
  readonly favoriteToggled = output<UnifiedArticle>();

  ngOnInit(): void {
    throw new Error('Not implemented: ArticleCardComponent');
  }
}