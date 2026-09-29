// Only this public URL is exposed through next.config.ts; never expose the whole environment.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(
  /\/+$/,
  '',
);
