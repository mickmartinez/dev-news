import { ChangeDetectionStrategy, Component, OnInit, input, output } from '@angular/core';
import { ArticleSource } from '../../../models/article.model';

@Component({
  selector: 'app-feed-filters',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedFiltersComponent implements OnInit {
  readonly availableSources = input.required<ArticleSource[]>();
  readonly availableTags = input.required<string[]>();
  readonly selectedSources = input.required<ArticleSource[]>();
  readonly selectedTags = input.required<string[]>();
  readonly sourceToggled = output<ArticleSource>();
  readonly tagToggled = output<string>();
  readonly filtersCleared = output<void>();

  ngOnInit(): void {
    throw new Error('Not implemented: FeedFiltersComponent');
  }
}