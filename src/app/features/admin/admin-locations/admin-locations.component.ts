import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocationService } from '../../../core/services/location.service';
import { AdminLocationDTO, AdminLocationAliasDTO } from '../../../core/models/location';

@Component({
  selector: 'app-admin-locations',
  standalone: false,
  templateUrl: './admin-locations.component.html',
  styleUrls: ['./admin-locations.component.css']
})
export class AdminLocationsComponent implements OnInit {

  locations: AdminLocationDTO[] = [];
  filteredLocations: AdminLocationDTO[] = [];
  loading = false;
  error = '';
  success = '';
  searchQuery = '';

  // Location Form
  showLocationModal = false;
  locationForm: FormGroup;
  isEditingLocation = false;
  currentLocationId: number | null = null;
  submitLoading = false;

  // Aliases Form
  showAliasModal = false;
  selectedLocation: AdminLocationDTO | null = null;
  aliases: AdminLocationAliasDTO[] = [];
  aliasesLoading = false;
  
  aliasForm: FormGroup;
  isEditingAlias = false;
  currentAliasId: number | null = null;

  constructor(
    private locationService: LocationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.locationForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/.*\S.*/)]]
    });
    this.aliasForm = this.fb.group({
      alias: ['', [Validators.required, Validators.pattern(/.*\S.*/)]]
    });
  }

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading = true;
    this.error = '';
    this.locationService.getAllAdminLocations().subscribe({
      next: (res) => {
        this.locations = res.data || [];
        this.filterLocations();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load locations';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  filterLocations(): void {
    if (!this.searchQuery) {
      this.filteredLocations = [...this.locations];
      return;
    }
    const q = this.searchQuery.toLowerCase();
    this.filteredLocations = this.locations.filter(l => l.name.toLowerCase().includes(q));
  }

  openLocationModal(location?: AdminLocationDTO): void {
    this.error = '';
    this.success = '';
    if (location) {
      this.isEditingLocation = true;
      this.currentLocationId = location.locationId;
      this.locationForm.patchValue({ name: location.name });
    } else {
      this.isEditingLocation = false;
      this.currentLocationId = null;
      this.locationForm.reset();
    }
    this.showLocationModal = true;
  }

  closeLocationModal(): void {
    this.showLocationModal = false;
    this.locationForm.reset();
  }

  saveLocation(): void {
    if (this.locationForm.invalid) return;
    this.submitLoading = true;
    this.error = '';
    this.success = '';
    const name = this.locationForm.value.name;

    if (this.isEditingLocation && this.currentLocationId) {
      this.locationService.updateLocationName(this.currentLocationId, name).subscribe({
        next: (res) => {
          this.success = 'Location updated successfully';
          this.submitLoading = false;
          this.closeLocationModal();
          this.loadLocations();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update location';
          this.submitLoading = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.locationService.createLocation(name).subscribe({
        next: (res) => {
          this.success = 'Location added successfully';
          this.submitLoading = false;
          this.closeLocationModal();
          this.loadLocations();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to add location';
          this.submitLoading = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  toggleLocationStatus(location: AdminLocationDTO): void {
    const newStatus = !location.isActive;
    this.locationService.updateLocationStatus(location.locationId, newStatus).subscribe({
      next: () => {
        this.success = `Location ${newStatus ? 'activated' : 'deactivated'} successfully`;
        this.loadLocations();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update status';
        this.cdr.markForCheck();
      }
    });
  }

  // --- Aliases ---
  
  openManageAliases(location: AdminLocationDTO): void {
    this.selectedLocation = location;
    this.showAliasModal = true;
    this.aliases = [];
    this.error = '';
    this.success = '';
    this.isEditingAlias = false;
    this.aliasForm.reset();
    this.loadAliases(location.locationId);
  }

  closeAliasModal(): void {
    this.showAliasModal = false;
    this.selectedLocation = null;
    this.aliases = [];
    this.error = '';
    this.success = '';
  }

  loadAliases(locationId: number): void {
    this.aliasesLoading = true;
    this.locationService.getAliasesForLocation(locationId).subscribe({
      next: (res) => {
        this.aliases = res.data || [];
        this.aliasesLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load aliases';
        this.aliasesLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  editAlias(alias: AdminLocationAliasDTO): void {
    this.isEditingAlias = true;
    this.currentAliasId = alias.aliasId;
    this.aliasForm.patchValue({ alias: alias.alias });
    this.error = '';
    this.success = '';
  }

  cancelEditAlias(): void {
    this.isEditingAlias = false;
    this.currentAliasId = null;
    this.aliasForm.reset();
  }

  saveAlias(): void {
    if (this.aliasForm.invalid || !this.selectedLocation) return;
    this.submitLoading = true;
    this.error = '';
    this.success = '';
    const aliasValue = this.aliasForm.value.alias;

    if (aliasValue.toLowerCase().trim() === this.selectedLocation.name.toLowerCase().trim()) {
      this.error = 'Alias cannot be the same as the canonical location name.';
      this.submitLoading = false;
      return;
    }

    const locationId = this.selectedLocation.locationId;

    if (this.isEditingAlias && this.currentAliasId) {
      this.locationService.updateAliasName(locationId, this.currentAliasId, aliasValue).subscribe({
        next: (res) => {
          this.success = 'Alias updated successfully';
          this.submitLoading = false;
          this.cancelEditAlias();
          this.loadAliases(locationId);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update alias';
          this.submitLoading = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.locationService.createAlias(locationId, aliasValue).subscribe({
        next: (res) => {
          this.success = 'Alias added successfully';
          this.submitLoading = false;
          this.cancelEditAlias();
          this.loadAliases(locationId);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to add alias';
          this.submitLoading = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  toggleAliasStatus(alias: AdminLocationAliasDTO): void {
    if (!this.selectedLocation) return;
    const newStatus = !alias.isActive;
    this.locationService.updateAliasStatus(this.selectedLocation.locationId, alias.aliasId, newStatus).subscribe({
      next: (res) => {
        alias.isActive = res.data?.isActive ?? newStatus;
        this.success = `Alias ${alias.isActive ? 'activated' : 'deactivated'} successfully`;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to update alias status';
      }
    });
  }
}
