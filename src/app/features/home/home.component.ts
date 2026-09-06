import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface PopularRoute {
  from: string;
  to: string;
  label: string;
}

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface OfferItem {
  icon: string;
  title: string;
  description: string;
  code: string;
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  fromCity = '';
  toCity = '';
  journeyDate = '';
  minDate = '';
  errorMessage = '';

  readonly popularRoutes: PopularRoute[] = [
    { from: 'Bangalore', to: 'Chennai', label: 'Most booked' },
    { from: 'Hyderabad', to: 'Bangalore', label: 'Popular route' },
    { from: 'Mumbai', to: 'Pune', label: 'Daily departures' },
    { from: 'Delhi', to: 'Jaipur', label: 'Weekend favourite' },
    { from: 'Chennai', to: 'Coimbatore', label: 'Popular route' },
    { from: 'Kolkata', to: 'Siliguri', label: 'Scenic journey' },
  ];

  readonly offers: OfferItem[] = [
    {
      icon: 'bi-percent',
      title: 'First Booking Offer',
      description: 'Get exciting discounts on your first bus booking.',
      code: 'FIRSTBUS',
    },
    {
      icon: 'bi-calendar-week',
      title: 'Weekend Special',
      description: 'Enjoy special fares on selected weekend journeys.',
      code: 'WEEKEND',
    },
    {
      icon: 'bi-shield-check',
      title: 'Best Price Guarantee',
      description: 'Find great buses at competitive prices every day.',
      code: 'BESTPRICE',
    },
  ];

  readonly features: FeatureItem[] = [
    {
      icon: 'bi-bus-front',
      title: 'Wide Bus Selection',
      description: 'Compare operators, timings, and amenities across hundreds of routes.',
    },
    {
      icon: 'bi-lightning-charge',
      title: 'Instant Booking',
      description: 'Book seats in minutes with a fast, guided checkout experience.',
    },
    {
      icon: 'bi-shield-lock',
      title: 'Secure Payments',
      description: 'Pay safely with encrypted transactions and instant confirmations.',
    },
    {
      icon: 'bi-headset',
      title: '24/7 Support',
      description: 'Get help anytime for bookings, cancellations, and trip changes.',
    },
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    const today = new Date();
    this.minDate = this.formatDateInput(today);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.fromCity = params['from'] || '';
      this.toCity = params['to'] || '';
      this.journeyDate = params['date'] || '';
    });
  }

  swapLocations(): void {
    const temporaryCity = this.fromCity;
    this.fromCity = this.toCity;
    this.toCity = temporaryCity;
  }

  selectPopularRoute(route: PopularRoute): void {
    this.fromCity = route.from;
    this.toCity = route.to;
    this.errorMessage = '';
    this.scrollToSearch();
  }

  searchBuses(): void {
    this.errorMessage = '';

    if (!this.fromCity.trim() || !this.toCity.trim() || !this.journeyDate) {
      this.errorMessage = 'Please enter departure city, destination city, and journey date.';
      return;
    }

    if (this.fromCity.trim().toLowerCase() === this.toCity.trim().toLowerCase()) {
      this.errorMessage = 'Departure and destination cities cannot be the same.';
      return;
    }

    if (this.journeyDate < this.minDate) {
      this.errorMessage = 'Journey date cannot be in the past.';
      return;
    }

    this.router.navigate(['/search'], {
      queryParams: {
        from: this.fromCity.trim(),
        to: this.toCity.trim(),
        date: this.journeyDate,
      },
    });
  }

  private scrollToSearch(): void {
    document.getElementById('bus-search')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private formatDateInput(date: Date): string {
    return (
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0')
    );
  }
}
