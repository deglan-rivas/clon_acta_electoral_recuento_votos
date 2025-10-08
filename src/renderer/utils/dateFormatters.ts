// Date and time formatting utilities for Peruvian electoral actas

/**
 * Formats a date to HH:MM:SS format (24-hour) in Peruvian timezone
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Formats a date to DD/MM/YYYY format in Peruvian timezone
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formats a date to full datetime string for display
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Calculates elapsed time between two dates and returns formatted string
 */
export function formatElapsedTime(startDate: Date, endDate: Date): string {
  const diff = endDate.getTime() - startDate.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
