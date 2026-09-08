import { Component, EventEmitter, Input, OnInit, Output, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap, finalize } from 'rxjs/operators';
import { LocationService } from '../../../core/services/location.service';
import { LocationDTO } from '../../../core/models/location';

@Component({
  selector: 'app-location-autocomplete',
  standalone: false,
  templateUrl: './location-autocomplete.html',
  styleUrl: './location-autocomplete.css'
})
export class LocationAutocompleteComponent implements OnInit, OnDestroy {
  @Input() label: string = 'Location';
  @Input() placeholder: string = 'Search location';
  @Input() iconClass: string = 'bi-geo-alt';
  
  // Initial value support
  @Input() set initialLocation(loc: {id: number, name: string} | null) {
    if (loc) {
      this.selectedLocation = { locationId: loc.id, canonicalName: loc.name, displayAlias: loc.name };
      this.searchControl.setValue(loc.name, { emitEvent: false });
    }
  }

  @Output() locationSelected = new EventEmitter<LocationDTO | null>();

  searchControl = new FormControl('');
  suggestions: LocationDTO[] = [];
  isLoading = false;
  showSuggestions = false;
  errorMessage = '';

  private selectedLocation: LocationDTO | null = null;
  private sub: Subscription = new Subscription();

  constructor(
    private locationService: LocationService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.searchControl.valueChanges
        .pipe(
          tap(value => {
            // If the user types something new, invalidate the previously selected location ID
            if (this.selectedLocation && this.selectedLocation.displayAlias !== value) {
              this.selectedLocation = null;
              this.locationSelected.emit(null);
            }
          }),
          debounceTime(300),
          distinctUntilChanged(),
          switchMap(query => {
            if (!query || query.trim().length < 1) {
              this.suggestions = [];
              return of(null);
            }
            if (this.selectedLocation && this.selectedLocation.displayAlias === query) {
              // Exact match from selection, don't search again
              return of(null);
            }
            this.isLoading = true;
            this.errorMessage = '';
            return this.locationService.getSuggestions(query).pipe(
              catchError(() => {
                this.errorMessage = 'Failed to load suggestions';
                return of({ data: [] });
              }),
              finalize(() => {
                this.isLoading = false;
              })
            );
          })
        )
        .subscribe(response => {
          if (response && response.data) {
            this.suggestions = response.data;
            this.showSuggestions = true;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  selectSuggestion(suggestion: LocationDTO): void {
    this.selectedLocation = suggestion;
    this.searchControl.setValue(suggestion.displayAlias, { emitEvent: false });
    this.showSuggestions = false;
    this.locationSelected.emit(suggestion);
  }

  clearSelection(): void {
    this.searchControl.setValue('');
    this.selectedLocation = null;
    this.suggestions = [];
    this.locationSelected.emit(null);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showSuggestions = false;
    }
  }

  onFocus() {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    } else if (this.searchControl.value && this.searchControl.value.trim().length >= 1) {
      // Trigger search if they focus back and there's text but no suggestions
      this.searchControl.setValue(this.searchControl.value);
    }
  }
}
