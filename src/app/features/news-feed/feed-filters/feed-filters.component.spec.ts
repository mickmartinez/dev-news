import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeedFiltersComponent } from './feed-filters.component';

describe('FeedFiltersComponent', () => {
  let fixture: ComponentFixture<FeedFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FeedFiltersComponent] }).compileComponents();
    fixture = TestBed.createComponent(FeedFiltersComponent);
    fixture.componentRef.setInput('availableSources', ['devto']);
    fixture.componentRef.setInput('availableTags', ['angular']);
    fixture.componentRef.setInput('selectedSources', []);
    fixture.componentRef.setInput('selectedTags', []);
  });

  it('GivenAvailableFilters_WhenSourceAndTagClicked_ThenEmitsTheirValues', () => {
    // Arrange
    const sources: string[] = [];
    const tags: string[] = [];
    fixture.componentInstance.sourceToggled.subscribe((source) => sources.push(source));
    fixture.componentInstance.tagToggled.subscribe((tag) => tags.push(tag));

    // Act
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="source-devto"]')
      ?.click();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="tag-angular"]')
      ?.click();

    // Assert
    expect(sources).toEqual(['devto']);
    expect(tags).toEqual(['angular']);
  });

  it('GivenNoSelections_WhenRendered_ThenClearIsDisabled', () => {
    // Arrange
    // Act
    fixture.detectChanges();

    // Assert
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid="clear-filters"]')
        ?.disabled,
    ).toBe(true);
  });

  it('GivenSelections_WhenClearClicked_ThenEmitsClearEvent', async () => {
    // Arrange
    const clears: void[] = [];
    fixture.detectChanges();
    fixture.componentRef.setInput('selectedTags', ['angular']);
    fixture.componentInstance.filtersCleared.subscribe(() => clears.push(undefined));

    // Act
    fixture.detectChanges();
    await fixture.whenStable();
    const clearButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="clear-filters"]',
    );
    expect(clearButton?.disabled).toBe(false);
    clearButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Assert
    expect(clears).toHaveLength(1);
  });
});