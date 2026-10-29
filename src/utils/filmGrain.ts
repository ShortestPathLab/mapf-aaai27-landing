// Correlated RGB grain generated on the GPU, without uploading video frames.
const VERTEX = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;
const FRAGMENT = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif
  uniform float u_frame;
  float random(vec2 point, float seed) {
    vec3 p = fract(vec3(point, seed) * vec3(0.1031, 0.11369, 0.13787));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }
  void main() {
    vec2 point = floor(gl_FragCoord.xy);
    float luminance = random(point, u_frame);
    vec3 colour = vec3(
      random(point + vec2(17.0, 59.0), u_frame + 11.0),
      random(point + vec2(73.0, 23.0), u_frame + 37.0),
      random(point + vec2(41.0, 97.0), u_frame + 67.0)
    );
    // Mostly luminance grain, with independent colour variation in each channel.
    gl_FragColor = vec4(mix(vec3(luminance), colour, 1.0), 1.0);
  }
`;

const FPS = 24;
const GRAIN_SIZE = 1.25; // CSS pixels, independent of a high-DPI screen's device ratio.

export function createFilmGrain(canvas: HTMLCanvasElement) {
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let frameUniform: WebGLUniformLocation | null = null;
  let animation = 0;
  let frame = 0;
  let lastDraw = 0;
  let active = false;
  let wanted = false;
  let destroyed = false;
  let lost = false;
  let unavailable = false;

  const render = () => {
    if (!gl || !program) return;
    gl.useProgram(program);
    gl.uniform1f(frameUniform, (frame % 4096) + 0.123);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    // Bound fragment work on large monitors; mobile uses a much smaller buffer.
    const scale = Math.min(
      1 / GRAIN_SIZE,
      1600 / bounds.width,
      1100 / bounds.height
    );
    const width = Math.max(1, Math.round(bounds.width * scale));
    const height = Math.max(1, Math.round(bounds.height * scale));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl?.viewport(0, 0, width, height);
    render();
  };
  const sizeObserver = new ResizeObserver(resize);

  const initialize = () => {
    if (unavailable || destroyed || lost) return false;
    if (gl && program) return true;
    try {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      });
    } catch {
      gl = null;
    }
    if (!gl) {
      unavailable = true;
      canvas.dataset.grainState = "unavailable";
      return false;
    }
    const context = gl;
    const compile = (type: number, source: string) => {
      const shader = context.createShader(type);
      if (!shader) return null;
      context.shaderSource(shader, source);
      context.compileShader(shader);
      if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
        context.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertex = compile(context.VERTEX_SHADER, VERTEX);
    const fragment = compile(context.FRAGMENT_SHADER, FRAGMENT);
    const linked = context.createProgram();
    if (vertex && fragment && linked) {
      context.attachShader(linked, vertex);
      context.attachShader(linked, fragment);
      context.linkProgram(linked);
    }
    if (vertex) context.deleteShader(vertex);
    if (fragment) context.deleteShader(fragment);
    if (
      !vertex ||
      !fragment ||
      !linked ||
      !context.getProgramParameter(linked, context.LINK_STATUS)
    ) {
      if (linked) context.deleteProgram(linked);
      unavailable = true;
      canvas.dataset.grainState = "unavailable";
      return false;
    }
    program = linked;
    buffer = context.createBuffer();
    if (!buffer) {
      context.deleteProgram(linked);
      program = null;
      unavailable = true;
      canvas.dataset.grainState = "unavailable";
      return false;
    }
    context.useProgram(program);
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(
      context.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      context.STATIC_DRAW
    );
    const position = context.getAttribLocation(program, "a_position");
    context.enableVertexAttribArray(position);
    context.vertexAttribPointer(position, 2, context.FLOAT, false, 0, 0);
    frameUniform = context.getUniformLocation(program, "u_frame");
    context.disable(context.DEPTH_TEST);
    context.disable(context.BLEND);
    resize();
    sizeObserver.observe(canvas);
    return true;
  };

  const tick = (time: number) => {
    if (!active) return;
    if (time - lastDraw >= 1000 / FPS) {
      frame++;
      render();
      lastDraw = time;
    }
    animation = requestAnimationFrame(tick);
  };
  const stop = () => {
    wanted = false;
    active = false;
    cancelAnimationFrame(animation);
    animation = 0;
    if (!unavailable && !lost) canvas.dataset.grainState = "paused";
  };
  const hide = () => {
    stop();
    delete canvas.dataset.ready;
  };
  const start = () => {
    wanted = true;
    if (active || destroyed || !initialize()) return;
    active = true;
    lastDraw = performance.now() - 1000;
    tick(performance.now());
    canvas.dataset.ready = "true";
    canvas.dataset.grainState = "running";
  };
  const onLost = (event: Event) => {
    event.preventDefault();
    const resume = wanted;
    hide();
    wanted = resume;
    lost = true;
    canvas.dataset.grainState = "unavailable";
  };
  const onRestored = () => {
    gl = null;
    program = null;
    buffer = null;
    frameUniform = null;
    lost = false;
    unavailable = false;
    if (wanted) start();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return {
    start,
    stop,
    hide,
    destroy() {
      destroyed = true;
      hide();
      sizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (gl) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      gl = null;
      program = null;
      buffer = null;
    },
  };
}
