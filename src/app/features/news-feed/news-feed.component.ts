import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { NewsFeedStateService } from '../../services/news-feed-state.service';

@Component({
  selector: 'app-news-feed',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsFeedComponent implements OnInit {
  readonly state = inject(NewsFeedStateService);

  ngOnInit(): void {
    throw new Error('Not implemented: NewsFeedComponent');
  }

  retry(): void {
    throw new Error('Not implemented: retry');
  }
}