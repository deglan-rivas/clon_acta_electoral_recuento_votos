// Category-specific color themes
export interface CategoryColors {
  light: string;  // For zebra striping (alternating with white)
  dark: string;   // For headers and ranking bars
}

export const getCategoryColors = (category: string): CategoryColors => {
  switch (category) {
    case 'presidencial':
      return { light: '#e8f6fa', dark: '#7dc9e3' };
    case 'senadoresNacional':
      return { light: '#faf0f3', dark: '#e0a8bb' };
    case 'senadoresRegional':
      return { light: '#fdf5f0', dark: '#e1b89a' };
    case 'diputados':
      return { light: '#f0f8f3', dark: '#a3d9b8' };
    case 'parlamentoAndino':
      return { light: '#fefdf0', dark: '#ede999' };
    default:
      return { light: '#e5e7eb', dark: '#f3f4f6' };
  }
};
