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

  it('GivenTagFilteringDisabledInputOmitted_WhenComponentCreated_ThenDefaultsToFalseAndTopicsButtonsAreEnabled', () => {
    // Arrange
    // (tagFilteringDisabled input not set, relies on default)

    // Act
    fixture.detectChanges();

    // Assert
    const tagButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="tag-angular"]',
    );
    expect(tagButton?.disabled).toBe(false);
  });

  it('GivenTagFilteringDisabledFalse_WhenTopicsButtonsRendered_ThenNoneHaveTheDisabledAttribute', () => {
    // Arrange
    fixture.componentRef.setInput('tagFilteringDisabled', false);

    // Act
    fixture.detectChanges();

    // Assert
    const tagButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="tag-angular"]',
    );
    expect(tagButton?.disabled).toBe(false);
  });

  it('GivenTagFilteringDisabledTrue_WhenTopicsButtonsRendered_ThenAllHaveTheDisabledAttributeAndDisabledStyleClasses', () => {
    // Arrange
    fixture.componentRef.setInput('tagFilteringDisabled', true);

    // Act
    fixture.detectChanges();

    // Assert
    const tagButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="tag-angular"]',
    );
    expect(tagButton?.disabled).toBe(true);
    expect(tagButton?.className).toContain('disabled:cursor-not-allowed');
    expect(tagButton?.className).toContain('disabled:opacity-40');
  });

  it('GivenTagFilteringDisabledTrue_WhenSourceButtonsRendered_ThenNoneHaveTheDisabledAttribute', () => {
    // Arrange
    fixture.componentRef.setInput('tagFilteringDisabled', true);

    // Act
    fixture.detectChanges();

    // Assert
    const sourceButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="source-devto"]',
    );
    expect(sourceButton?.disabled).toBe(false);
  });

  it('GivenTagFilteringDisabledTrue_WhenATopicsButtonIsClicked_ThenTagToggledOutputDoesNotEmit', () => {
    // Arrange
    const tags: string[] = [];
    fixture.componentInstance.tagToggled.subscribe((tag) => tags.push(tag));
    fixture.componentRef.setInput('tagFilteringDisabled', true);
    fixture.detectChanges();

    // Act
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-testid="tag-angular"]')
      ?.click();

    // Assert
    expect(tags).toEqual([]);
  });

  it('GivenTagFilteringDisabledTrueAndATagWasPreviouslySelected_WhenTopicsButtonsRendered_ThenThatButtonStillHasAriaPressedTrue', () => {
    // Arrange
    fixture.componentRef.setInput('selectedTags', ['angular']);
    fixture.componentRef.setInput('tagFilteringDisabled', true);

    // Act
    fixture.detectChanges();

    // Assert
    const tagButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="tag-angular"]',
    );
    expect(tagButton?.getAttribute('aria-pressed')).toBe('true');
    expect(tagButton?.disabled).toBe(true);
  });

  it('GivenTagFilteringDisabledTransitionsFromTrueToFalse_WhenTopicsButtonsRerendered_ThenTheDisabledAttributeIsRemovedAndButtonsAreClickableAgain', () => {
    // Arrange
    fixture.componentRef.setInput('tagFilteringDisabled', true);
    fixture.detectChanges();
    const tagButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[data-testid="tag-angular"]',
    );
    expect(tagButton?.disabled).toBe(true);

    // Act
    fixture.componentRef.setInput('tagFilteringDisabled', false);
    fixture.detectChanges();

    // Assert
    expect(tagButton?.disabled).toBe(false);
  });
});