import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FavoritesStoreService } from '../../services/favorites-store.service';
import { FavoriteListItemComponent } from './favorite-list-item/favorite-list-item.component';

@Component({
  selector: 'app-favorites-view',
  imports: [FavoriteListItemComponent],
  templateUrl: './favorites-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesViewComponent {
  readonly favoritesStore = inject(FavoritesStoreService);

  removeFavorite(id: string): void {
    void Promise.resolve(this.favoritesStore.remove(id)).catch(() => undefined);
  }
}