// Tiny MLP inference (weights exported from train.py). Runs in Node and in the browser.


export function forward(W, x) {
  let h = Float64Array.from(x);
  if (W.mean) for (let i = 0; i < h.length; i++) h[i] = (h[i] - W.mean[i]) / W.std[i];
  for (let l = 0; l < W.layers.length; l++) {
    const L = W.layers[l], o = new Float64Array(L.b.length), last = l === W.layers.length - 1;
    for (let j = 0; j < o.length; j++) { let v = L.b[j]; const r = L.w[j]; for (let i = 0; i < h.length; i++) v += r[i] * h[i]; o[j] = last || v > 0 ? v : 0; }
    h = o;
  }
  return h;
}
export function netAct(W, x, isLegal) {
  const q = forward(W, x); let best = -1;
  for (let i = 0; i < q.length; i++) if (isLegal(i) && (best < 0 || q[i] > q[best])) best = i;
  return best;
}
