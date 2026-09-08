export interface WalletDTO {
  walletId: string;
  userId: string;
  balance: number;
}

export interface WalletTransactionDTO {
  transactionId: string;
  amount: number;
  transactionType: 'CREDIT' | 'DEBIT';
  description: string;
  referenceId: string;
  createdAt: string;
}

export interface WalletRechargeRequest {
  amount: number;
  upiId: string;
}
