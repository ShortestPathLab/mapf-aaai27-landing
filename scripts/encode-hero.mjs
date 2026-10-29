import { execFile, spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rename, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

if (!process.argv[2]) {
  console.error('Usage: node scripts/encode-hero.mjs "/path/to/source.mp4" [--ping-pong] [--desktop-only]');
  process.exit(1);
}

const input = resolve(process.argv[2]);
const pingPong = process.argv.includes("--ping-pong");
const desktopOnly = process.argv.includes("--desktop-only");
const output = fileURLToPath(new URL("../public/videos/", import.meta.url));
const work = await mkdtemp(resolve(tmpdir(), "aaai-hero-"));
const run = promisify(execFile);
const fps = 24;
const variants = [
  { name: "desktop", width: 1920, height: 1080, mp4Budget: 14000000, maxMp4: 5000 },
  { name: "mobile", width: 1280, height: 720, mp4Budget: 2023720, maxMp4: 800 },
].filter(variant => !desktopOnly || variant.name === "desktop");

function ffmpeg(args) {
  return new Promise((done, reject) => {
    const child = spawn("ffmpeg", ["-hide_banner", "-nostdin", "-y", ...args], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", code => code === 0 ? done() : reject(new Error(`ffmpeg exited with ${code}`)));
  });
}

async function probe(filename) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", filename]);
  return JSON.parse(stdout);
}

async function twoPass(common, codec, filename, stats) {
  const pass = ["-passlogfile", resolve(work, stats)];
  await ffmpeg([...common, ...codec, ...pass, "-pass", "1", "-f", "null", "-"]);
  await ffmpeg([...common, ...codec, ...pass, "-pass", "2", resolve(work, filename)]);
}

async function encodeToBudget(common, codec, rate, filename, stats, budget) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await twoPass(common, codec(rate), filename, stats);
    const bytes = (await stat(resolve(work, filename))).size;
    if (bytes <= budget * 1.03) return;
    rate = Math.floor(rate * budget / bytes * 0.97);
    console.log(`Retuning ${filename}: ${bytes} bytes; retrying at ${rate} kb/s.`);
  }
  throw new Error(`Cannot meet the size budget for ${filename}`);
}

try {
  await mkdir(output, { recursive: true });
  // Freeze the input: replacing a Windows export during encoding must not truncate our files.
  const snapshot = resolve(work, "source.mp4");
  await copyFile(input, snapshot);
  const original = await probe(snapshot);
  const stream = original.streams.find(item => item.codec_type === "video");
  if (!stream) throw new Error("Source has no video stream.");
  const sourceDuration = Number(stream.duration || original.format.duration);
  const sourceFrames = Math.round(sourceDuration * fps);
  if (sourceFrames < 3) throw new Error("Source is unexpectedly short; refusing to replace the hero.");

  let encodeInput = snapshot;
  const expectedFrames = pingPong ? sourceFrames * 2 - 2 : sourceFrames;
  const duration = expectedFrames / fps;
  if (pingPong) {
    encodeInput = resolve(work, "ping-pong.mkv");
    // Omit repeated endpoint frames, avoiding a tiny hold at either end of the loop.
    const filter = `[0:v:0]fps=${fps},split=2[f][r];[f]setpts=PTS-STARTPTS[forward];[r]reverse,trim=start_frame=1:end_frame=${sourceFrames - 1},setpts=PTS-STARTPTS[backward];[forward][backward]concat=n=2:v=1:a=0[loop]`;
    await ffmpeg(["-i", snapshot, "-filter_complex", filter, "-map", "[loop]", "-an", "-map_metadata", "-1", "-c:v", "ffv1", "-level", "3", "-threads", "4", "-pix_fmt", "yuv420p", encodeInput]);
    const loop = await probe(encodeInput);
    if (Number(loop.streams.find(item => item.codec_type === "video")?.nb_read_frames) !== expectedFrames) {
      throw new Error("Ping-pong frame count is incorrect.");
    }
  }

  console.log(`Encoding ${expectedFrames} frames (${duration.toFixed(3)}s), ping-pong=${pingPong}`);
  for (const variant of variants) {
    if (variant.width > stream.width || variant.height > stream.height) throw new Error("Refusing to upscale the source.");
    const common = ["-i", encodeInput, "-map", "0:v:0", "-an", "-sn", "-dn", "-map_metadata", "-1", "-vf", `fps=${fps},scale=${variant.width}:${variant.height}:flags=lanczos`, "-pix_fmt", "yuv420p", "-g", "120"];
    const mp4Rate = Math.floor(variant.mp4Budget * 8 * 0.98 / duration / 1000);
    await encodeToBudget(common, rate => ["-c:v", "libx264", "-preset", "medium", "-b:v", `${rate}k`, "-maxrate", `${variant.maxMp4}k`, "-bufsize", `${variant.maxMp4 * 2}k`, "-threads", "2", "-movflags", "+faststart"], mp4Rate, `hero-${variant.name}.mp4`, `${variant.name}-h264`, variant.mp4Budget);
  }

  // Validate every complete output before replacing anything the website serves.
  for (const variant of variants) {
    const filename = `hero-${variant.name}.mp4`;
    const path = resolve(work, filename);
    const meta = await probe(path);
    const video = meta.streams.find(item => item.codec_type === "video");
    const bytes = (await stat(path)).size;
    const budget = variant.mp4Budget;
    if (Math.abs(Number(meta.format.duration) - duration) > 0.1 || Number(video?.nb_read_frames) !== expectedFrames || video.width !== variant.width || video.height !== variant.height || meta.streams.some(item => item.codec_type === "audio") || bytes > budget * 1.08) {
      throw new Error(`Output validation failed: ${filename}`);
    }
    console.log(`${filename}: ${bytes} bytes, ${video.width}x${video.height}, ${expectedFrames} frames`);
  }
  for (const variant of variants) {
    const filename = `hero-${variant.name}.mp4`;
    const next = resolve(output, `.${filename}.next`);
    await copyFile(resolve(work, filename), next);
    await rename(next, resolve(output, filename));
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
