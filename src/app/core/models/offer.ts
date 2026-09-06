export interface Offer {

  title: string;

  description: string;

  code: string;

  discountType: 'PERCENTAGE' | 'FIXED';

  discountValue: number;

}