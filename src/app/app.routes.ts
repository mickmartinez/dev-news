import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./features/news-feed/news-feed.component').then((module) => module.NewsFeedComponent),
	},
	{
		path: 'favorites',
		loadComponent: () => import('./features/favorites/favorites-view.component').then((module) => module.FavoritesViewComponent),
	},
];
