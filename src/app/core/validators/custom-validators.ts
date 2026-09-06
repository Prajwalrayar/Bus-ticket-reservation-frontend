import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {

  static validName(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null; // Let required validator handle empty

      const trimmed = value.trim();
      if (trimmed.length < 3) return { minlength: true };
      if (trimmed.length > 50) return { maxlength: true };

      if (!/^[a-zA-Z ]+$/.test(trimmed)) {
        return { pattern: true };
      }

      // Check dummy/placeholder names
      const noSpace = trimmed.replace(/\s/g, '').toLowerCase();
      if (noSpace.length > 0) {
        const firstChar = noSpace[0];
        let allSame = true;
        for (let i = 1; i < noSpace.length; i++) {
          if (noSpace[i] !== firstChar) {
            allSame = false;
            break;
          }
        }
        if (allSame) return { invalidName: true };
      }

      const lower = trimmed.toLowerCase();
      if (lower === 'abc' || lower === 'test' || lower === 'dummy') {
        return { invalidName: true };
      }

      return null;
    };
  }

  static validPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      if (value.length < 8 || value.length > 20) return { length: true };
      
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasDigit = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};:'",.<>/?\\]/.test(value);

      if (!hasUpper) return { missingUppercase: true };
      if (!hasLower) return { missingLowercase: true };
      if (!hasDigit) return { missingDigit: true };
      if (!hasSpecial) return { missingSpecial: true };

      return null;
    };
  }

  static validIndianPhone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      let value = control.value;
      if (!value) return null;

      value = value.trim();
      if (value.startsWith('+91')) {
        value = value.substring(3);
      } else if (value.startsWith('91') && value.length === 12) {
        value = value.substring(2);
      }

      if (!/^[6-9]\d{9}$/.test(value)) {
        return { invalidPhone: true };
      }

      return null;
    };
  }

  static validEmail(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const trimmed = value.trim();
      
      const emailRegex = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,7}$/;
      if (!emailRegex.test(trimmed)) {
        return { invalidEmail: true };
      }

      const lower = trimmed.toLowerCase();
      if (lower.startsWith('aaa@') || lower.startsWith('abc@') || lower.startsWith('test@')) {
        return { invalidEmail: true };
      }

      return null;
    };
  }
}
