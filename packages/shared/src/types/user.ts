export interface User { 
  id: string; 
  bvn: string; 
  fullName: string; 
  phoneNumber: string;
}

export interface BankAccount {
  id?: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  sellerId: string;
  buyerId?: string;
}
