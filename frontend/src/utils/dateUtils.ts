/**
 * Utilidades para formateo de fechas
 */

/**
 * Formatea una fecha como "día de mes del año"
 * Ejemplo: "7 de mayo del 2025"
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Si la fecha no es válida, devolver string vacío
  if (isNaN(dateObj.getTime())) return '';
  
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  
  // Array de meses en español
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const month = months[dateObj.getMonth()];
  
  return `${day} de ${month} del ${year}`;
};

// Función de ayuda para obtener textos relativos como "Hoy", "Ayer", etc.
export const getRelativeTimeText = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Verificar si es hoy
  if (dateObj.toDateString() === now.toDateString()) {
    return 'Hoy';
  }
  
  // Verificar si es ayer
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dateObj.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  }
  
  return formatDate(dateObj);
}; 