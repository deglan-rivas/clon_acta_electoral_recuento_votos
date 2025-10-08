// Toast styling constants for consistent notification appearance

export const TOAST_STYLES = {
  error: {
    background: '#dc2626',
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: '16px',
  },
  success: {
    background: '#16a34a',
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: '16px',
  },
  info: {
    background: '#2563eb',
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: '16px',
  },
  warning: {
    background: '#f59e0b',
    color: 'white',
    fontWeight: 'bold' as const,
    fontSize: '16px',
  }
} as const;

// Common widths for different message types
export const TOAST_WIDTHS = {
  small: '300px',
  medium: '400px',
  large: '500px',
} as const;

// Common durations
export const TOAST_DURATIONS = {
  short: 2000,
  medium: 3000,
  long: 4000,
} as const;
