import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AiService } from '../../core/services/ai.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { PersonalizedOfferResponse } from '../../core/models/ai.model';

@Component({
  selector: 'app-home-search',
  standalone: false,
  templateUrl: './home-search.html',
  styleUrl: './home-search.css',
})
export class HomeSearch implements OnInit {
  isSmartSearch = false;
  smartQuery = '';
  offers: PersonalizedOfferResponse[] = [];
  isLoading = false;

  constructor(
    private router: Router, 
    private aiService: AiService,
    private authStateService: AuthStateService
  ) {}

  ngOnInit() {
    if (this.authStateService.isLoggedIn()) {
      const user = this.authStateService.getUser();
      if (user && user.userId) {
        this.aiService.getPersonalizedOffers(user.userId).subscribe({
          next: (res: any) => {
            if (res.success && res.data) {
              this.offers = res.data.filter((o: any) => !o.isUsed);
            }
          }
        });
      }
    }
  }

  toggleSearchMode() {
    this.isSmartSearch = !this.isSmartSearch;
  }

  performSmartSearch() {
    if (!this.smartQuery.trim()) return;
    this.isLoading = true;
    this.aiService.searchBusesByNaturalLanguage(this.smartQuery).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          // Navigate to bus-search and pass data via state
          this.router.navigate(['/bus-search'], { state: { aiResults: res.data } });
        }
      },
      error: () => {
        this.isLoading = false;
        alert('Failed to perform smart search. Please try again.');
      }
    });
  }
}
