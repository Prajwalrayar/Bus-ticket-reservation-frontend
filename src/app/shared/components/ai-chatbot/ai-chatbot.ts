import { Component, effect, ChangeDetectorRef } from '@angular/core';
import { AiService } from '../../../core/services/ai.service';
import { AuthStateService } from '../../../core/services/auth-state.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
  text: string;
  isBot: boolean;
}

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chatbot.html',
  styleUrls: ['./ai-chatbot.css']
})
export class AiChatbotComponent {
  isOpen = false;
  messages: ChatMessage[] = [];
  currentMessage = '';
  isTyping = false;

  constructor(private aiService: AiService, private authStateService: AuthStateService, private cdr: ChangeDetectorRef) {
    effect(() => {
      if (this.authStateService.isLoggedIn()) {
        if (this.messages.length === 0 || this.messages[0].text.includes('Please log in')) {
          this.messages = [{
            text: 'Hello! I am your AI Travel Assistant. How can I help you today?',
            isBot: true
          }];
        }
      } else {
        this.messages = [{
          text: 'Please log in to use the AI Travel Assistant.',
          isBot: true
        }];
      }
      this.cdr.detectChanges();
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.currentMessage.trim() || !this.authStateService.isLoggedIn()) {
      return;
    }

    const userText = this.currentMessage;
    this.messages.push({ text: userText, isBot: false });
    this.currentMessage = '';
    this.isTyping = true;

    this.aiService.sendChatMessage({ message: userText }).subscribe({
      next: (res) => {
        this.isTyping = false;
        if (res.success && res.data) {
          this.messages.push({ text: res.data.response, isBot: true });
        } else {
          this.messages.push({ text: 'Sorry, I encountered an error.', isBot: true });
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.isTyping = false;
        this.messages.push({ text: 'Unable to reach the AI service.', isBot: true });
        this.cdr.detectChanges();
      }
    });
  }
}
