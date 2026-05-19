"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_click;
  uniform float u_click_time;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.52;
    for (int i = 0; i < 4; i++) {
      value += amp * noise(p);
      p *= 1.9;
      amp *= 0.48;
    }
    return value;
  }

  void main() {
    float pixel = 10.0;
    vec2 coord = gl_FragCoord.xy;
    vec2 cell = floor(coord / pixel);
    vec2 local = fract(coord / pixel);
    vec2 uv = coord / u_resolution;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);

    float n = fbm(cell * 0.11 + vec2(u_time * 0.08, -u_time * 0.035));
    float bayer = hash(cell) - 0.5;
    float field = n + bayer * 0.28 - 0.56;

    float t = max(u_time - u_click_time, 0.0);
    vec2 clickUv = u_click;
    vec2 d = (uv - clickUv) * vec2(aspect, 1.0);
    float dist = length(d);
    float ring = exp(-pow((dist - t * 0.22) / 0.035, 2.0)) * exp(-t * 0.75);
    if (u_click.x < 0.0) ring = 0.0;
    field = max(field, ring * 1.08);

    float shape = step(abs(local.x - 0.5), 0.38) * step(abs(local.y - 0.5), 0.38);
    float edgeFade = smoothstep(0.0, 0.22, min(min(uv.x, uv.y), min(1.0 - uv.x, 1.0 - uv.y)));
    float coverage = smoothstep(0.18, 0.72, field) * shape * edgeFade;

    vec3 cyan = vec3(0.11, 0.76, 0.88);
    vec3 blue = vec3(0.07, 0.35, 0.98);
    vec3 green = vec3(0.08, 0.65, 0.48);
    vec3 color = mix(cyan, blue, smoothstep(0.18, 0.92, uv.x));
    color = mix(color, green, ring * 0.34);

    float alpha = coverage * (0.2 + 0.28 * smoothstep(0.24, 1.0, uv.x));
    alpha += ring * shape * 0.24;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.52));
  }
`;

export function PixelBlast() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });

    const enableFallback = () => {
      container.classList.add("pixel-blast-fallback");
    };

    if (!gl) {
      enableFallback();
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) {
      enableFallback();
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      enableFallback();
      return;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      enableFallback();
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      enableFallback();
      return;
    }

    container.classList.remove("pixel-blast-fallback");
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const clickLocation = gl.getUniformLocation(program, "u_click");
    const clickTimeLocation = gl.getUniformLocation(program, "u_click_time");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let pulseTimer = 0;
    let pulseKickoff = 0;
    let start = performance.now();
    let lastClick = { x: -1, y: -1, time: -1000 };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      return { width, height };
    };

    const draw = (now: number) => {
      const { width, height } = resize();
      const time = (now - start) * 0.001;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(resolutionLocation, width, height);
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(clickLocation, lastClick.x, lastClick.y);
      gl.uniform1f(clickTimeLocation, lastClick.time);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!motionQuery.matches) {
        frameId = window.requestAnimationFrame(draw);
      }
    };

    const triggerRipple = () => {
      const points = [
        [0.72, 0.58],
        [0.84, 0.36],
        [0.58, 0.44],
        [0.78, 0.72],
      ];
      const elapsed = performance.now() - start;
      const point = points[Math.floor((elapsed / 3100) % points.length)];
      const drift = Math.sin(elapsed * 0.0013) * 0.035;

      lastClick = {
        x: Math.min(Math.max(point[0] + drift, 0.08), 0.94),
        y: Math.min(Math.max(point[1] - drift * 0.7, 0.08), 0.92),
        time: elapsed * 0.001,
      };
    };

    const startAutoPulse = () => {
      window.clearInterval(pulseTimer);
      window.clearTimeout(pulseKickoff);
      if (motionQuery.matches) return;
      pulseKickoff = window.setTimeout(triggerRipple, 560);
      pulseTimer = window.setInterval(triggerRipple, 2800);
    };

    const restart = () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(pulseTimer);
      window.clearTimeout(pulseKickoff);
      start = performance.now();
      lastClick = { x: -1, y: -1, time: -1000 };
      draw(start);
      startAutoPulse();
    };

    const handleResize = () => {
      if (motionQuery.matches) {
        draw(performance.now());
      }
    };

    restart();
    window.addEventListener("resize", handleResize);
    motionQuery.addEventListener("change", restart);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(pulseTimer);
      window.clearTimeout(pulseKickoff);
      window.removeEventListener("resize", handleResize);
      motionQuery.removeEventListener("change", restart);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return (
    <div ref={containerRef} className="pixel-blast-container pixel-blast-fallback" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
