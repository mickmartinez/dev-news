import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ArticleSource } from '../../../models/article.model';

@Component({
  selector: 'app-feed-filters',
  templateUrl: './feed-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedFiltersComponent {
  readonly availableSources = input.required<ArticleSource[]>();
  readonly availableTags = input.required<string[]>();
  readonly selectedSources = input<ArticleSource[]>([]);
  readonly selectedTags = input<string[]>([]);
  readonly sourceToggled = output<ArticleSource>();
  readonly tagToggled = output<string>();
  readonly filtersCleared = output<void>();

  clearFilters(): void {
    this.filtersCleared.emit();
  }
}
