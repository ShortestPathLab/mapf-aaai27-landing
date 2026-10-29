export default {
  image: {
    // Keep this hero as JPEG so browsers can display its progressive scans.
    src_exclude: /^\/(?:images\/burrow-hero\.jpg$|vercel\/image\?)/,
    jpeg: { options: { progressive: true } },
  },
  // HeroMedia handles source loading and the transition from still to video.
  video: { autoplay_lazyload: { when: "never" } },
};
