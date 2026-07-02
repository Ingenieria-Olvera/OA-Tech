import { defineConfig } from 'vite';

// base: './' keeps asset paths relative so the built site works on
// GitHub Pages project sites (https://<user>.github.io/OA-Tech/)
// without knowing the repo name at build time.
export default defineConfig({
  base: './',
});
