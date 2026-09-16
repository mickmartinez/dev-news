import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FavoriteRecord } from '../../../models/favorite.model';

@Component({
  selector: 'app-favorite-list-item',
  imports: [DatePipe],
  templateUrl: './favorite-list-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoriteListItemComponent {
  readonly favorite = input.required<FavoriteRecord>();
  readonly remove = output<string>();
}
