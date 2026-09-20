import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BusService } from '../../../core/services/bus.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { BusDTO, BusCreateRequest } from '../../../core/models/bus';

@Component({
  selector: 'app-admin-buses',
  standalone: false,
  templateUrl: './admin-buses.component.html',
  styleUrl: './admin-buses.component.css'
})
export class AdminBusesComponent implements OnInit {
  buses: BusDTO[] = [];
  filteredBuses: BusDTO[] = [];
  loading: boolean = true;
  error: string = '';

  // Company Filters
  availableCompanies: string[] = [];
  selectedCompanies: Set<string> = new Set<string>();

  showBusModal: boolean = false;
  busForm: BusCreateRequest = {
    registrationNumber: '',
    busType: 'SEATER',
    amenities: [],
    operatorCompanyName: ''
  };
  availableAmenities = ['AC', 'WiFi', 'Water Bottle', 'Blankets', 'Charging Point', 'Reading Light', 'TV'];
  selectedAmenities = new Set<string>();

  busSubmitSuccess: string = '';
  busSubmitError: string = '';
  isEditingBus: boolean = false;

  constructor(
    private busService: BusService,
    private cdr: ChangeDetectorRef,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.fetchAllBuses();
  }

  fetchAllBuses(): void {
    this.loading = true;
    this.error = '';
    this.busService.getAllBuses().subscribe({
      next: (data: any) => {
        this.buses = data;
        this.extractCompanies(data);
        this.applyFilters();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Failed to fetch buses', err);
        this.error = 'Failed to load fleet data.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  extractCompanies(buses: BusDTO[]): void {
    const companies = new Set<string>();
    buses.forEach(b => {
      if (b.operatorCompanyName) {
        companies.add(b.operatorCompanyName);
      }
    });
    this.availableCompanies = Array.from(companies).sort();
  }

  toggleCompanyFilter(company: string, event: any): void {
    if (event.target.checked) {
      this.selectedCompanies.add(company);
    } else {
      this.selectedCompanies.delete(company);
    }
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedCompanies.clear();
    // uncheck checkboxes in UI by forcing angular view update through bindings
    this.applyFilters();
  }

  applyFilters(): void {
    if (this.selectedCompanies.size === 0) {
      this.filteredBuses = [...this.buses];
    } else {
      this.filteredBuses = this.buses.filter(b => this.selectedCompanies.has(b.operatorCompanyName));
    }
    this.cdr.markForCheck();
  }

  toggleAmenity(amenity: string, event: any): void {
    if (event.target.checked) {
      this.selectedAmenities.add(amenity);
    } else {
      this.selectedAmenities.delete(amenity);
    }
  }

  openBusModal(bus?: BusDTO): void {
    this.busSubmitSuccess = '';
    this.busSubmitError = '';
    this.selectedAmenities.clear();
    
    if (bus) {
      this.isEditingBus = true;
      this.busForm = {
        registrationNumber: bus.registrationNumber,
        busType: bus.busType,
        operatorCompanyName: bus.operatorCompanyName,
        amenities: [...bus.amenities]
      };
      if (bus.amenities) {
        bus.amenities.forEach(a => this.selectedAmenities.add(a));
      }
    } else {
      this.isEditingBus = false;
      this.busForm = {
        registrationNumber: '',
        busType: 'SEATER',
        operatorCompanyName: '',
        amenities: []
      };
    }
    this.showBusModal = true;
  }

  closeBusModal(): void {
    this.showBusModal = false;
  }

  saveBus(): void {
    this.busSubmitError = '';
    this.busSubmitSuccess = '';
    
    this.busForm.amenities = Array.from(this.selectedAmenities);

    if (this.isEditingBus) {
      this.busService.updateBus(this.busForm.registrationNumber, this.busForm).subscribe({
        next: (res: any) => {
          this.busSubmitSuccess = 'Bus updated successfully.';
          this.fetchAllBuses();
          setTimeout(() => {
            this.closeBusModal();
            this.cdr.markForCheck();
          }, 1500);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Error updating bus', err);
          this.busSubmitError = err.error?.message || 'Failed to update bus.';
          this.cdr.markForCheck();
        }
      });
    } else {
      this.busService.createBus(this.busForm).subscribe({
        next: (res: any) => {
          this.busSubmitSuccess = 'Bus created successfully.';
          this.fetchAllBuses();
          setTimeout(() => {
            this.closeBusModal();
            this.cdr.markForCheck();
          }, 1500);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Error creating bus', err);
          this.busSubmitError = err.error?.message || 'Failed to create bus.';
          this.cdr.markForCheck();
        }
      });
    }
  }

  // ── Activation Request Management ────────────────────────────────────────
  pendingActivations: BusDTO[] = [];
  pendingActivationsLoading: boolean = false;
  activeTab: 'all' | 'pending' = 'all';

  // Approval modal state
  showApprovalModal: boolean = false;
  approvalBus: BusDTO | null = null;
  approvalCompensationAmount: number = 0;
  approvalAdminNote: string = '';
  approvalLoading: boolean = false;
  approvalError: string = '';
  approvalSuccess: string = '';

  loadPendingActivations(): void {
    this.pendingActivationsLoading = true;
    this.busService.getPendingActivationRequests().subscribe({
      next: (data: any) => {
        this.pendingActivations = data;
        this.pendingActivationsLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Failed to load pending activations', err);
        this.pendingActivationsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  switchTab(tab: 'all' | 'pending'): void {
    this.activeTab = tab;
    if (tab === 'pending') {
      this.loadPendingActivations();
    }
    this.cdr.markForCheck();
  }

  openApprovalModal(bus: BusDTO): void {
    this.approvalBus = bus;
    this.approvalCompensationAmount = 0;
    this.approvalAdminNote = '';
    this.approvalError = '';
    this.approvalSuccess = '';
    this.showApprovalModal = true;
    this.cdr.markForCheck();
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
    this.approvalBus = null;
    this.cdr.markForCheck();
  }

  approveActivation(): void {
    if (!this.approvalBus) return;
    this.approvalLoading = true;
    this.approvalError = '';
    this.busService.approveActivationRequest(
      this.approvalBus.registrationNumber,
      this.approvalCompensationAmount,
      this.approvalAdminNote
    ).subscribe({
      next: () => {
        this.approvalLoading = false;
        this.approvalSuccess = `Approved! Operator will be notified to pay ₹${this.approvalCompensationAmount}.`;
        setTimeout(() => {
          this.closeApprovalModal();
          this.loadPendingActivations();
          this.fetchAllBuses();
          this.cdr.markForCheck();
        }, 1500);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.approvalLoading = false;
        this.approvalError = err.error?.message || 'Failed to approve.';
        this.cdr.markForCheck();
      }
    });
  }

  rejectActivation(bus: BusDTO): void {
    this.confirmService.confirm(`Reject activation request for bus ${bus.registrationNumber}?`).subscribe(confirmed => {
      if (!confirmed) return;
      const note = prompt('Optional: Provide a rejection reason for the operator:') ?? '';
      this.busService.rejectActivationRequest(bus.registrationNumber, note).subscribe({
        next: () => {
          this.loadPendingActivations();
          this.fetchAllBuses();
          this.cdr.markForCheck();
        },
        error: (err: any) => console.error('Failed to reject', err)
      });
    });
  }
}
