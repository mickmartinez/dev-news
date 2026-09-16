import { routes } from './app.routes';

describe('app routes', () => {
  it('GivenAppRoutes_WhenResolved_ThenRootFeedAndFavoritesAreLazyRoutes', () => {
    // Arrange
    const rootRoute = routes.find((route) => route.path === '');
    const favoritesRoute = routes.find((route) => route.path === 'favorites');

    // Act
    const rootLoader = rootRoute?.loadComponent;
    const favoritesLoader = favoritesRoute?.loadComponent;

    // Assert
    expect(rootLoader).toBeTypeOf('function');
    expect(favoritesLoader).toBeTypeOf('function');
  });
});