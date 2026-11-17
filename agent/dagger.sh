#!/bin/zsh
# One DAgger round: train on all data so far, then generate net-driven data labelled by search, then eval.
# Usage: ./dagger.sh ROUND BETA MATCHES_PER_WORKER
set -e
cd "$(dirname "$0")"
R=$1; BETA=$2; M=$3
mkdir -p policy data/r$R logs
python3 train.py policy/r$R.json data/r*/*.jsonl > logs/train_r$R.log 2>&1
tail -2 logs/train_r$R.log
for w in 0 1 2 3 4 5 6; do node sim/gen.mjs data/r$R/w$w.jsonl $((R*10000 + w*100)) $M policy/r$R.json $BETA 0.6 > logs/r${R}_w$w.log 2>&1 & done
node sim/evalnet.mjs policy/r$R.json $((R*1000+50000)) 4 mbapu > logs/eval_r${R}_boss.log 2>&1 &
node sim/evalnet.mjs policy/r$R.json $((R*1000+60000)) 4 mix > logs/eval_r${R}_mix.log 2>&1 &
wait
echo "round $R boss: $(grep -c '"won":true' logs/eval_r${R}_boss.log)/4  mix: $(grep -c '"won":true' logs/eval_r${R}_mix.log)/4"
