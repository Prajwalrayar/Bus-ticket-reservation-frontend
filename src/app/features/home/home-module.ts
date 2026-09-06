import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { SharedModule } from '../../shared/shared-module';
import { HomeSearch } from '../home-search/home-search';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [HomeComponent, HomeSearch],
  imports: [CommonModule, RouterModule, SharedModule, FormsModule, ReactiveFormsModule],
})
export class HomeModule {}
