import type { Blueprint } from '../types/blueprint';

const BASE_URL = '/api';

export interface ValidationResult {
  isValid: boolean;
  errors: { code: string; field: string; message: string }[];
}

export async function validateBlueprint(blueprint: Blueprint): Promise<ValidationResult> {
  const response = await fetch(`${BASE_URL}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(blueprint),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Validation request failed.' }));
    throw new Error(err.message ?? 'Validation failed.');
  }
  return response.json() as Promise<ValidationResult>;
}

export async function provisionBlueprint(blueprint: Blueprint): Promise<void> {
  const response = await fetch(`${BASE_URL}/provision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(blueprint),
  });

  if (!response.ok) {
    const contentType = response.headers.get('Content-Type') ?? '';
    if (contentType.includes('application/json')) {
      const err = await response.json().catch(() => ({ message: 'Provision failed.' }));
      const messages: string[] = Array.isArray(err.errors) ? err.errors : [err.message ?? 'Provision failed.'];
      throw new Error(messages.join('\n'));
    }
    throw new Error(`Provision failed with status ${response.status}.`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const filename =
    response.headers.get('Content-Disposition')?.match(/filename="?([^"]+)"?/)?.[1] ??
    'project.zip';
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
