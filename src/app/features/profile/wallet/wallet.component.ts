import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletDTO, WalletTransactionDTO } from '../../../core/models/wallet';

@Component({
  selector: 'app-wallet',
  standalone: false,
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.css']
})
export class WalletComponent implements OnInit {
  wallet: WalletDTO | null = null;
  transactions: WalletTransactionDTO[] = [];
  
  rechargeAmount: number = 100;
  upiId: string = '';
  
  isRecharging: boolean = false;
  isLoading: boolean = true;
  errorMessage: string = '';
  successMessage: string = '';
  
  constructor(
    private walletService: WalletService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWalletData();
  }

  loadWalletData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.walletService.getMyWallet().subscribe({
      next: (wallet) => {
        this.wallet = wallet;
        this.loadTransactions();
        this.cdr.markForCheck();
      },
      error: (err) => {
        if (err.status === 403 || err.status === 401) {
          this.errorMessage = 'Please log in to access your wallet.';
        } else {
          this.errorMessage = err.error?.message || 'Could not load wallet balance. Please refresh the page.';
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadTransactions(): void {
    this.walletService.getMyTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load recent transactions';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  recharge(form: NgForm): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (form.invalid) {
      Object.values(form.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    if (this.rechargeAmount < 100) {
      this.errorMessage = 'Minimum recharge amount is ₹100';
      return;
    }

    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(this.upiId)) {
      this.errorMessage = 'Invalid UPI ID format';
      return;
    }

    this.isRecharging = true;
    this.walletService.rechargeWallet({ amount: this.rechargeAmount, upiId: this.upiId }).subscribe({
      next: (wallet) => {
        this.wallet = wallet;
        this.successMessage = 'Wallet recharged successfully';
        this.rechargeAmount = 100;
        this.upiId = '';
        this.loadTransactions();
        this.isRecharging = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to recharge wallet';
        this.isRecharging = false;
        this.cdr.markForCheck();
      }
    });
  }
}
