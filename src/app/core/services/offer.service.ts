import { Injectable } from '@angular/core';
import { Offer } from '../models/offer';

@Injectable({
  providedIn: 'root',
})
export class OfferService {

  private offers: Offer[] = [

    {
      title: 'First Booking Offer',
      description: 'Get 10% off on your first bus booking.',
      code: 'FIRSTBUS',
      discountType: 'PERCENTAGE',
      discountValue: 10
    },

    {
      title: 'Weekend Special',
      description: 'Get ₹200 off on selected weekend journeys.',
      code: 'WEEKEND',
      discountType: 'FIXED',
      discountValue: 200
    },

    {
      title: 'Best Price Guarantee',
      description: 'Enjoy competitive fares on selected buses.',
      code: 'BESTPRICE',
      discountType: 'PERCENTAGE',
      discountValue: 5
    }

  ];


  getOffers(): Offer[] {

    return this.offers;

  }


  getOfferByCode(code: string): Offer | undefined {

    return this.offers.find(
      offer =>
        offer.code.toLowerCase() ===
        code.trim().toLowerCase()
    );

  }

   // ==========================================================
  // CALCULATE DISCOUNT
  // ==========================================================

  calculateDiscount(
    offer: Offer,
    baseAmount: number
  ): number {

    if (baseAmount <= 0) {

      return 0;

    }


    // --------------------------------------------------------
    // PERCENTAGE DISCOUNT
    // --------------------------------------------------------

    if (offer.discountType === 'PERCENTAGE') {

      const discount =
        (baseAmount * offer.discountValue) / 100;

      return Math.round(discount);

    }


    // --------------------------------------------------------
    // FIXED DISCOUNT
    // --------------------------------------------------------

    if (offer.discountType === 'FIXED') {

      return Math.min(
        offer.discountValue,
        baseAmount
      );

    }


    return 0;

  }

}
