export function parseLabelText(text) {
  if (!text) return {};
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result = {};

  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) result.year = yearMatch[0];

  const lower = text.toLowerCase();
  if (lower.includes('ros\u00e9') || lower.includes('rose')) result.color = 'rose';
  else if (lower.includes('white') || lower.includes('blanc')) result.color = 'white';
  else if (lower.includes('sparkling') || lower.includes('champagne')) result.color = 'sparkling';
  else if (lower.includes('red') || lower.includes('rouge')) result.color = 'red';

  const regions = [
    'bordeaux','burgundy','napa','tuscany','rioja','mosel','champagne','provence','piedmont','alsace','rhone','chianti','sonoma','barossa','mendoza','willamette'
  ];
  for (const r of regions) {
    if (lower.includes(r)) {
      result.region = r.charAt(0).toUpperCase() + r.slice(1);
      break;
    }
  }

  if (lines[0]) result.producer = lines[0];
  if (lines[1]) result.name = lines[1];

  return result;
}
