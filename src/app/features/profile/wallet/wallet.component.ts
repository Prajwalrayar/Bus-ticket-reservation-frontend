import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgForm } from '@angular/forms';
import { WalletService } from '../../../core/services/wallet.service';
import { WalletDTO, WalletTransactionDTO } from '../../../core/models/wallet';

declare var Razorpay: any;

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

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-checkout-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async recharge(form: NgForm): Promise<void> {
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

    this.isRecharging = true;
    this.cdr.markForCheck();

    const isScriptLoaded = await this.loadRazorpayScript();
    if (!isScriptLoaded) {
      this.errorMessage = 'Failed to load Razorpay SDK. Please check your connection.';
      this.isRecharging = false;
      this.cdr.markForCheck();
      return;
    }

    this.walletService.createRechargeOrder({ amount: this.rechargeAmount, upiId: '' }).subscribe({
      next: (orderData) => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount * 100, // paise
          currency: orderData.currency,
          name: 'Wallet Top-up',
          description: 'Recharging wallet by ₹' + this.rechargeAmount,
          order_id: orderData.orderId,
          handler: (response: any) => {
            this.verifyRazorpayPayment(response);
          },
          prefill: {
            name: 'Passenger',
          },
          modal: {
            ondismiss: () => {
              this.isRecharging = false;
              this.errorMessage = 'Top-up was cancelled by user.';
              this.cdr.markForCheck();
            }
          },
          theme: {
            color: '#dc3545'
          }
        };
        
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          this.isRecharging = false;
          this.errorMessage = response.error.description || 'Top-up failed.';
          this.cdr.markForCheck();
        });
        rzp.open();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to initiate recharge';
        this.isRecharging = false;
        this.cdr.markForCheck();
      }
    });
  }

  verifyRazorpayPayment(response: any): void {
    const verifyReq = {
      razorpayPaymentId: response.razorpay_payment_id,
      razorpayOrderId: response.razorpay_order_id,
      razorpaySignature: response.razorpay_signature
    };

    this.walletService.verifyRechargePayment(verifyReq).subscribe({
      next: (wallet) => {
        this.wallet = wallet;
        this.successMessage = 'Wallet recharged successfully';
        this.rechargeAmount = 100;
        this.loadTransactions();
        this.isRecharging = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to verify payment';
        this.isRecharging = false;
        this.cdr.markForCheck();
      }
    });
  }
}
