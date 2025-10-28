export const validateEmail = (email: string): string | null => {
  if (!email) return 'L\'email est requis';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Format d\'email invalide';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Le mot de passe est requis';
  if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
  if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une majuscule';
  if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir au moins une minuscule';
  if (!/[0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre';
  if (!/[@#$%^&+=!]/.test(password)) return 'Le mot de passe doit contenir au moins un caractère spécial (@, #, $, %, ^, &, +, =, !)';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone) return null;
  const phoneRegex = /^[3-9]\d{8}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) return 'Format de téléphone invalide (9 chiffres après +261, commençant par 3-9)';
  return null;
};

export const validateName = (name: string, fieldName: string): string | null => {
  if (!name) return `${fieldName} est requis`;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(name)) return `${fieldName} ne doit contenir que des lettres`;
  if (name.length < 2) return `${fieldName} doit contenir au moins 2 caractères`;
  if (name.length > 50) return `${fieldName} ne peut pas dépasser 50 caractères`;
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') return `${fieldName} est requis`;
  return null;
};

export const validateDate = (date: string): string | null => {
  if (!date) return null;
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Date invalide';
  return null;
};

export const validateDateRange = (startDate: string, endDate: string): string | null => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) return 'La date de début doit être antérieure à la date de fin';
  return null;
};

export const validateNumber = (value: string | number, min?: number, max?: number): string | null => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Valeur numérique invalide';
  if (min !== undefined && num < min) return `La valeur doit être au moins ${min}`;
  if (max !== undefined && num > max) return `La valeur ne peut pas dépasser ${max}`;
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value && value.length > maxLength) return `${fieldName} ne peut pas dépasser ${maxLength} caractères`;
  return null;
};
