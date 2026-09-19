import { Component, effect, NgZone, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AiService } from '../../../core/services/ai.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BookButton {
  tripId: string;
  from: string;
  to: string;
  date: string;
  fare: string;
}

interface DatePickerData {
  source: string;
  destination: string;
}

interface MessageSegment {
  type: 'text' | 'book_btn' | 'date_picker';
  safeHtml?: SafeHtml;
  bookData?: BookButton;
  datePickerData?: DatePickerData;
}

interface ChatMessage {
  text: string;
  isBot: boolean;
  segments: MessageSegment[];
}

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chatbot.html',
  styleUrls: ['./ai-chatbot.css']
})
export class AiChatbotComponent implements OnDestroy {
  isOpen = false;
  messages: ChatMessage[] = [];
  currentMessage = '';
  isTyping = false;

  constructor(
    private aiService: AiService,
    private authStateService: AuthStateService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const loggedIn = this.authStateService.isLoggedIn();
      this.ngZone.run(() => {
        if (loggedIn) {
          if (this.messages.length === 0 || this.messages[0].text.includes('Please log in')) {
            this.messages = [this.createBotMessage('Hello! I am your AI Travel Assistant. How can I help you today?')];
          }
        } else {
          this.messages = [this.createBotMessage('Hello! 👋 Please log in to use the AI Travel Assistant.')];
        }
      });
    });
  }

  get isLoggedIn(): boolean {
    return this.authStateService.isLoggedIn();
  }

  navigateToLogin() {
    this.isOpen = false;
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {}

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  private createBotMessage(text: string): ChatMessage {
    return { text, isBot: true, segments: this.parseMessage(text) };
  }

  /**
   * Parse response text into segments — splits on markers.
   */
  parseMessage(text: string): MessageSegment[] {
    const segments: MessageSegment[] = [];
    // Match either [BOOK_BTN:...] or [DATE_PICKER:...]
    const markerRegex = /\[(BOOK_BTN|DATE_PICKER):([^\]]+)\]/g;
    let lastIndex = 0;
    let match;

    while ((match = markerRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const rawText = text.substring(lastIndex, match.index);
        segments.push({ type: 'text', safeHtml: this.toSafeHtml(rawText) });
      }

      const type = match[1];
      const params: { [k: string]: string } = {};
      match[2].split(',').forEach(pair => {
        const eqIdx = pair.indexOf('=');
        if (eqIdx !== -1) {
          params[pair.substring(0, eqIdx).trim()] = pair.substring(eqIdx + 1).trim();
        }
      });

      if (type === 'BOOK_BTN') {
        segments.push({
          type: 'book_btn',
          bookData: {
            tripId: params['tripId'] || '',
            from: params['from'] || '',
            to: params['to'] || '',
            date: params['date'] || '',
            fare: params['fare'] || '0'
          }
        });
      } else if (type === 'DATE_PICKER') {
        segments.push({
          type: 'date_picker',
          datePickerData: {
            source: params['source'] || '',
            destination: params['destination'] || ''
          }
        });
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({ type: 'text', safeHtml: this.toSafeHtml(text.substring(lastIndex)) });
    }

    if (segments.length === 0) {
      segments.push({ type: 'text', safeHtml: this.toSafeHtml(text) });
    }

    return segments;
  }

  submitDate(source: string, destination: string, event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.currentMessage = `search buses from ${source} to ${destination} on ${input.value}`;
      this.sendMessage();
    }
  }

  private toSafeHtml(text: string): SafeHtml {
    const html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  bookBus(bookData: BookButton) {
    this.isOpen = false;
    this.router.navigate(['/seat-selection'], {
      queryParams: {
        tripId: bookData.tripId,
        from: bookData.from,
        to: bookData.to,
        date: bookData.date,
        fare: bookData.fare
      }
    });
  }

  sendMessage() {
    const text = this.currentMessage.trim();
    if (!text || !this.authStateService.isLoggedIn()) return;

    this.messages.push({ text, isBot: false, segments: [{ type: 'text', safeHtml: this.toSafeHtml(text) }] });
    this.currentMessage = '';
    this.isTyping = true;
    this.cdr.detectChanges();

    this.aiService.sendChatMessage({ message: text }).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.isTyping = false;
          const responseText = (res.success && res.data) ? res.data.response : 'Sorry, I encountered an error.';
          this.messages.push(this.createBotMessage(responseText));
          this.cdr.detectChanges();
          setTimeout(() => { this.scrollToBottom(); this.cdr.detectChanges(); }, 50);
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isTyping = false;
          this.messages.push(this.createBotMessage('Unable to reach the AI service. Please try again shortly.'));
          this.cdr.detectChanges();
        });
      }
    });
  }

  private scrollToBottom() {
    const chatBody = document.querySelector('.chat-body');
    if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
  }
}
