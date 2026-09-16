import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FavoritesStoreService } from '../../services/favorites-store.service';

@Component({
  selector: 'app-favorites-view',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesViewComponent implements OnInit {
  readonly favoritesStore = inject(FavoritesStoreService);

  ngOnInit(): void {
    throw new Error('Not implemented: FavoritesViewComponent');
  }
}