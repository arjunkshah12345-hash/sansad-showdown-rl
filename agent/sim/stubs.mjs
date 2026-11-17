// Minimal browser globals so the game bundle can load in Node.
import { createCanvas } from "@napi-rs/canvas";
const noop = () => {};
const deep = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : k === "then" ? undefined : deep()), apply: () => deep(), construct: () => deep() });
const el = () => { const e = deep(); return e; };
globalThis.window = globalThis;
globalThis.document = { createElement: (tag) => tag === "canvas" ? Object.assign(createCanvas(4, 4), { style: {}, addEventListener: noop }) : ({ relList: { supports: () => true }, getContext: () => null, style: {}, addEventListener: noop, appendChild: noop, classList: { add: noop, remove: noop, toggle: noop } }),
  querySelector: () => el(), createElementNS: () => ({ style: {}, addEventListener: noop, removeEventListener: noop, setAttribute: noop }), querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop, body: el(), documentElement: el(), head: el(), fonts: { ready: Promise.resolve(), load: () => Promise.resolve() }, hidden: false, visibilityState: "visible" };
globalThis.MutationObserver = class { observe() {} disconnect() {} };
try { Object.defineProperty(globalThis, "navigator", { value: { userAgent: "node", maxTouchPoints: 0, storage: {}, language: "en" }, configurable: true }); } catch {}
globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; }, key(i) { return Object.keys(this._d)[i]; }, get length() { return Object.keys(this._d).length; } };
globalThis.location = { hostname: "fightkaro.com", host: "fightkaro.com", protocol: "https:", pathname: "/", search: "", hash: "", origin: "https://fightkaro.com" };
globalThis.history = { replaceState: noop };
globalThis.matchMedia = () => ({ matches: false, addEventListener: noop });
globalThis.addEventListener = noop; globalThis.removeEventListener = noop;
globalThis.requestAnimationFrame = noop; globalThis.cancelAnimationFrame = noop;
globalThis.innerWidth = 1280; globalThis.innerHeight = 720; globalThis.devicePixelRatio = 1;
globalThis.Image = class { set src(v) {} };
globalThis.AudioContext = undefined;
export { deep };
