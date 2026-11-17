"""Distil the lookahead planner into an MLP.
Targets are soft: softmax(planner_value / TAU) over legal actions, plus a hard-label term.
Usage: python3 train.py OUT.json data1.jsonl [data2.jsonl ...]"""
import json, sys, random
import numpy as np, torch, torch.nn as nn

TAU, EPOCHS, HID = 2.0, 30, 256
out, files = sys.argv[1], sys.argv[2:]
X, V, M, Y = [], [], [], []
for f in files:
    for line in open(f):
        if not line.strip():
            continue
        r = json.loads(line)
        v = [x if x is not None else 0.0 for x in r["v"]]
        m = [x is not None for x in r["v"]]
        X.append(r["o"]); V.append(v); M.append(m); Y.append(r["y"])
X = np.array(X, np.float32); V = np.array(V, np.float32); M = np.array(M, bool); Y = np.array(Y, np.int64)
print("samples", len(X), "dim", X.shape[1])
mean, std = X.mean(0), X.std(0) + 1e-3
Xn = (X - mean) / std
dev = "mps" if torch.backends.mps.is_available() else "cpu"
Xt, Vt, Mt, Yt = (torch.tensor(a, device=dev) for a in (Xn, V, M, Y))
n = len(X); idx = list(range(n)); random.seed(0); random.shuffle(idx)
val = torch.tensor(idx[: n // 10], device=dev); tr = torch.tensor(idx[n // 10:], device=dev)
net = nn.Sequential(nn.Linear(X.shape[1], HID), nn.ReLU(), nn.Linear(HID, HID), nn.ReLU(), nn.Linear(HID, HID), nn.ReLU(), nn.Linear(HID, V.shape[1])).to(dev)
opt = torch.optim.AdamW(net.parameters(), 1e-3, weight_decay=1e-4)
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, EPOCHS)

def loss_fn(ix):
    logits = net(Xt[ix]).masked_fill(~Mt[ix], -1e4)
    tgt = torch.softmax((Vt[ix] / TAU).masked_fill(~Mt[ix], -1e4), 1)
    soft = -(tgt * torch.log_softmax(logits, 1)).sum(1).mean()
    hard = nn.functional.cross_entropy(logits, Yt[ix])
    return soft + 0.5 * hard, (logits.argmax(1) == Yt[ix]).float().mean()

for ep in range(EPOCHS):
    net.train(); perm = tr[torch.randperm(len(tr), device=dev)]
    for i in range(0, len(perm), 512):
        l, _ = loss_fn(perm[i:i + 512]); opt.zero_grad(); l.backward(); opt.step()
    sched.step()
    if ep % 5 == 4 or ep == EPOCHS - 1:
        net.eval()
        with torch.no_grad():
            vl, va = loss_fn(val)
            # regret: planner value of net's pick vs best
            lg = net(Xt[val]).masked_fill(~Mt[val], -1e4); pick = lg.argmax(1)
            vv = Vt[val].masked_fill(~Mt[val], -1e9)
            regret = (vv.max(1).values - vv.gather(1, pick[:, None])[:, 0]).mean()
        print(f"ep {ep+1} val_loss {vl.item():.3f} top1 {va.item():.3f} regret {regret.item():.2f}", flush=True)
layers = [m for m in net if isinstance(m, nn.Linear)]
json.dump({"mean": mean.tolist(), "std": std.tolist(),
           "layers": [{"w": l.weight.detach().cpu().numpy().round(5).tolist(), "b": l.bias.detach().cpu().numpy().round(5).tolist()} for l in layers]},
          open(out, "w"))
print("saved", out)
