# AAAI 2027 · Hands-on MAPF tutorial

Accepted half-day lab: **Hands-on Multi-Agent Path Finding and Emerging Trends**.
Adapted from the Optimisation and Planning Summer School 2025 site, retaining its visual style.

## Develop

Use Node.js 22 or later. Run `npm install` and `npm run dev`, then open http://localhost:4321.
Build with `npm run build`; preview with `npm run preview`.

The initial local copy shares the source project's dependencies through a `node_modules` symlink. To make dependencies independent, remove that symlink (`unlink node_modules`) before running `npm install`.
The Vite dependency cache is isolated in `.astro/vite`, and the dev server allows the resolved dependency directory, so running both sites does not break client component hydration.

## Edit content

- `src/pages/index.astro`: reference homepage layout, conference cards and links.
- `src/components/TutorialOverview.astro`: introduction and four modules.
- `src/components/MapfVideo.astro`: introductory MAPF video and playback control (`public/videos/mapf.mp4`).
- `src/tutorial.ts`: draft schedule (elapsed times; 4 hours including a 30-minute break), cover image paths, crop offsets and surface tints (`imageTint`).
- `src/content/team/*.yaml`: organiser biographies and placeholders.
- `src/pages/organisers.astro`: organiser list and contact placeholder.
- `src/pages/materials.astro`: resource cards (add each `href` when released) and setup guidance. `/preparation` redirects here.
- `src/layouts/BentoLayout.astro`: shared full-width layout for Organisers and Materials, with standalone cards on the canvas.
- `src/config.ts`: site title, description and social metadata.

Still needed: tutorial date, start time, room, contact, materials repository and setup instructions; Yue Zhang and Jingjin Yu biographies. Confirm the draft agenda before publishing.

Schedule covers use the four selected images in `output/event-covers/definitive-set`, on sessions 2, 4, 6 and 8. Compressed 1440px WebP copies live in `public/images/event-covers`; original PNGs are unchanged. The image-above-text treatment and desktop scroll parallax reuse the OPSS25 `ParallaxImage` component, with static covers on mobile and for reduced motion.

## Surface tokens

Theme values live in `src/styles/base.css`; background utilities are mapped in `tailwind.config.mjs`.

| Surface | Tailwind utility | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| Canvas | `bg-skin-fill` | `#fefcf9` | `#131212` | Page background |
| Muted | `bg-skin-surface-muted` | `#faf6f2` | `#181717` | Quiet areas between the canvas and a card |
| Card | `bg-skin-card` | `#f5f0eb` | `#1e1c1c` | Standard standalone cards |
| Accent | `bg-skin-surface-accent` | `#eddfd8` | `#352e29` | Highlighted surfaces with a soft accent tint |
| Raised | `bg-skin-surface-raised` | `#ebe3db` | `#2d2a28` | Controls, menus and overlays that sit over a card |

The three new CSS variables are `--color-surface-muted`, `--color-surface-accent` and `--color-surface-raised`. Like the existing colour variables, they store comma-separated RGB channels. Depth runs canvas → muted → card → raised; light-mode surfaces darken with depth and dark-mode surfaces lighten. Accent is a highlighted card variant.

Combine a background utility with `surface-panel` to reuse its padding and rounded corners, for example `class="surface-panel bg-skin-surface-accent"`. Opacity modifiers such as `bg-skin-surface-raised/80` are supported. The existing `bg-skin-card-muted` colour is used by the scrollbar.

## Hero media

`src/components/HeroMedia.astro` displays `public/images/burrow-hero.jpg`, a 2560px progressive JPEG, before loading the animated background. It fades in the first decoded video frame, with a pause/play control. Reduced-motion and data-saver preferences retain the still image; offscreen/hidden playback pauses. A network, codec or autoplay failure leaves the JPEG visible.

`HeroVideoToggle.astro` is rendered directly inside the hero, alongside the media's `Parallax` wrapper. Keep interactive controls outside that transformed, pointer-events-disabled media layer so they stay clickable and anchored to the hero card.

The browser chooses one silent 24fps H.264 MP4: desktop at 1920×1080 or mobile at 1280×720. Sources are assigned after the JPEG has loaded; none are requested for reduced-motion or data-saver users. Jampack is configured to preserve the progressive JPEG format and this loading behaviour.

The current loop is 45.08 seconds: the latest 22.58-second source followed by its reverse, without duplicate endpoint frames. Desktop MP4 is 13.18 MiB; mobile MP4 is 1.93 MiB. Desktop encodes use a larger budget to preserve fine foliage detail.

`src/utils/filmGrain.ts` generates coloured film grain separately using a WebGL shader, without uploading video frames or increasing the video bitrate. The canvas sits above the video and beneath the existing shade and text. It updates at 12fps with a capped drawing resolution; it freezes with playback and releases resources on navigation. Browsers without WebGL keep the video without grain. Adjust `FPS` and `GRAIN_SIZE` in that file, or the `--hero-grain-opacity` CSS custom property (default `0.4`), to tune the effect.

To replace the video later, run `node scripts/encode-hero.mjs "/path/to/source.mp4" --ping-pong` for a one-way source, or omit the flag for a complete loop. Add `--desktop-only` to leave mobile files untouched. This requires FFmpeg/FFprobe with libx264. The script snapshots the source into temporary storage, optionally appends a reversed copy without duplicated endpoint frames, and makes two-pass MP4 encodes against fixed budgets (desktop: 14 MB; mobile: approximately 2.02 MB). It validates duration, frame count, resolution, audio removal and file size before replacing the selected files in `public/videos/`. The large source and lossless intermediate stay outside the site and temporary files are cleaned up.

## Hosting

The site is published at **https://aaai27.pathfinding.ai** through GitHub Pages. `.github/workflows/deploy.yml` installs dependencies from `bun.lock`, builds and optimises the static site, and deploys `dist/` on pushes to `main`. It can also be run manually from the Actions tab. The `multi-page` branch preserves the previous layout and does not deploy.

GitHub Pages must use **GitHub Actions** as its publishing source, with `aaai27.pathfinding.ai` configured as its custom domain and HTTPS enabled. `public/CNAME` records the domain in the source; Astro defaults to that production URL for canonical links, social previews and the sitemap. `SITE_URL` can override it for another environment. DNS for the subdomain points to `shortestpathlab.github.io`.

## Sources

- Current hero still: user-supplied `output/hero-concepts/burrow-v2-reference-lighting-v1-tweaked.png`; progressive JPEG at `public/images/burrow-hero.jpg`. Animation: user-supplied `C:\Users\Kevin\Videos\Timeline 1.mp4`, encoded into `public/videos/`.
- Previous hero image supplied by the user: https://images.unsplash.com/photo-1650473395434-8674d953ef2f?q=80&w=2532&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D — retained locally as `public/images/abstract-hero.jpg`.

- User-provided AAAI27_Tutorial_Proposal.pdf (read locally; not distributed).
- User-provided Kevin Zheng biography, preserved verbatim.
- https://aaai.org/conference/aaai/aaai-27/ — conference dates and city, checked 28 October 2026.
- https://github.com/MAPF-Competition/Start-Kit
- https://github.com/MAPF-Competition/PlanViz
