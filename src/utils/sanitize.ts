export function escapeCsvField(field: any): string {
  if (field === null || field === undefined) {
    return '""';
  }
  const str = String(field).replace(/"/g, '""');
  // If string contains comma, newline, quotes, or starts with formula characters (=, +, -, @)
  if (str.search(/([",\n\r]|^[=+\-@])/) !== -1) {
    return `"${str}"`;
  }
  return `"${str}"`;
}

export function sanitizeText(input: string): string {
  if (!input) return '';
  return input.trim().replace(/[<>]/g, '');
}
