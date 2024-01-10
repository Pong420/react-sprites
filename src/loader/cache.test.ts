import { expect, test, vi } from 'vitest';
import { File, TextureCache } from './cache';
import { PackResult } from '../types';

test('stringify/parse', () => {
  const cache = new TextureCache('temp');
  const buffer = Buffer.from('');

  vi.spyOn(cache, 'readFile').mockImplementation(() => buffer);

  const files: File[] = [];
  const data = { frames: { key: { width: 1, height: 1 } }, images: [{ content: buffer }] };
  const stringified = cache.stringify(data, files, 'key');
  const parsed = cache.parse(JSON.parse(JSON.stringify(stringified)) as PackResult);

  expect(cache.stringify(data.frames)).toEqual(data.frames);
  expect(stringified['frames']).toEqual(data['frames']);
  expect(stringified).toHaveProperty('images[0].content', expect.any(String));
  expect(parsed).toEqual(data);
  expect(files.length).toBe(1);
});
