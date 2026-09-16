import { ChangeDetectionStrategy, Component, OnInit, input, output } from '@angular/core';
import { FavoriteRecord } from '../../../models/favorite.model';

@Component({
  selector: 'app-favorite-list-item',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteListItemComponent implements OnInit {
  readonly favorite = input.required<FavoriteRecord>();
  readonly remove = output<string>();

  ngOnInit(): void {
    throw new Error('Not implemented: FavoriteListItemComponent');
  }
}