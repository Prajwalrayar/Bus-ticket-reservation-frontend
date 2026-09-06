import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { OperatorService } from '../../../core/services/operator.service';
import { OperatorDTO } from '../../../core/models/operator';

@Component({
  selector: 'app-admin-operators',
  standalone: false,
  templateUrl: './admin-operators.component.html',
  styleUrl: './admin-operators.component.css'
})
export class AdminOperatorsComponent implements OnInit {
  operators: OperatorDTO[] = [];
  loading: boolean = true;
  error: string = '';

  showCreateModal: boolean = false;
  
  createForm = {
    companyName: '',
    contactEmail: '',
    contactPhone: ''
  };

  createSuccess: string = '';
  createError: string = '';

  constructor(
    private operatorService: OperatorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchOperators();
  }

  fetchOperators(): void {
    this.loading = true;
    this.error = '';
    this.operatorService.getAllOperators().subscribe({
      next: (data) => {
        this.operators = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load operators', err);
        this.error = 'Failed to load operators.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openCreateModal(): void {
    this.createSuccess = '';
    this.createError = '';
    this.createForm = { companyName: '', contactEmail: '', contactPhone: '' };
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  createOperator(): void {
    this.createError = '';
    this.createSuccess = '';
    
    this.operatorService.createOperator(this.createForm).subscribe({
      next: (res) => {
        this.createSuccess = 'Operating Company created successfully!';
        this.fetchOperators();
        setTimeout(() => {
          this.closeCreateModal();
          this.cdr.markForCheck();
        }, 1500);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.createError = err.error?.message || 'Failed to create Operating Company.';
        this.cdr.markForCheck();
      }
    });
  }

  approveOperator(op: OperatorDTO): void {
    if (confirm(`Are you sure you want to approve ${op.companyName}?`)) {
      this.operatorService.approveOperator(op.companyName).subscribe({
        next: () => {
          this.fetchOperators();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to approve operator.';
          this.cdr.markForCheck();
        }
      });
    }
  }
}
