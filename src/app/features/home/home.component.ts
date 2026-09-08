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
  fromLocationId: number | null = null;
  toLocationId: number | null = null;
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

  // Rest of the properties omitted for brevity...

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
      this.fromLocationId = params['fromId'] ? Number(params['fromId']) : null;
      this.toLocationId = params['toId'] ? Number(params['toId']) : null;
      this.journeyDate = params['date'] || '';
    });
  }

  get initialFromLocation() {
    return this.fromCity && this.fromLocationId ? { id: this.fromLocationId, name: this.fromCity } : null;
  }

  get initialToLocation() {
    return this.toCity && this.toLocationId ? { id: this.toLocationId, name: this.toCity } : null;
  }

  onFromSelected(location: import('../../core/models/location').LocationDTO | null) {
    if (location) {
      this.fromCity = location.displayAlias;
      this.fromLocationId = location.locationId;
    } else {
      this.fromCity = '';
      this.fromLocationId = null;
    }
  }

  onToSelected(location: import('../../core/models/location').LocationDTO | null) {
    if (location) {
      this.toCity = location.displayAlias;
      this.toLocationId = location.locationId;
    } else {
      this.toCity = '';
      this.toLocationId = null;
    }
  }

  swapLocations(): void {
    const tempCity = this.fromCity;
    const tempId = this.fromLocationId;
    this.fromCity = this.toCity;
    this.fromLocationId = this.toLocationId;
    this.toCity = tempCity;
    this.toLocationId = tempId;
  }

  selectPopularRoute(route: PopularRoute): void {
    this.fromCity = route.from;
    this.toCity = route.to;
    // We do not have IDs for popular routes here, but that's okay, 
    // the backend will fallback to string matching if IDs are missing,
    // or we can require them to select from the dropdown. 
    // Let's clear the IDs so the search uses the string fallback.
    this.fromLocationId = null;
    this.toLocationId = null;
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

    const queryParams: any = {
      from: this.fromCity.trim(),
      to: this.toCity.trim(),
      date: this.journeyDate,
    };
    
    if (this.fromLocationId) queryParams.fromId = this.fromLocationId;
    if (this.toLocationId) queryParams.toId = this.toLocationId;

    this.router.navigate(['/search'], { queryParams });
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
