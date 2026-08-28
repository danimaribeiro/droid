#!/bin/bash
set -e

# ---- cgroup v2 setup (from original docker-entrypoint.sh) ----
CGROUP_FS="/sys/fs/cgroup"
if [ ! -e "$CGROUP_FS" ]; then
  echo "Cannot find $CGROUP_FS. Please make sure your system is using cgroup v2"
  exit 1
fi

if [ -e "$CGROUP_FS/unified" ]; then
  echo "Combined cgroup v1+v2 mode is not supported."
  exit 1
fi

if [ ! -e "$CGROUP_FS/cgroup.subtree_control" ]; then
  echo "Cgroup v2 not found."
  exit 1
fi

cd /sys/fs/cgroup
mkdir -p isolate/
echo 1 > isolate/cgroup.procs
echo '+cpuset +cpu +io +memory +pids' > cgroup.subtree_control
cd isolate
mkdir -p init
echo 1 > init/cgroup.procs
echo '+cpuset +memory' > cgroup.subtree_control
echo "Initialized cgroup"

chown -R piston:piston /piston

# ---- Start Piston API in background ----
su -p piston -c 'ulimit -n 65536 && node /piston_api/src' &
PISTON_PID=$!

piston_get() {
  node -e "
    const http = require('http');
    http.get('http://localhost:2000$1', res => {
      let d=''; res.on('data',c=>d+=c); res.on('end',()=>process.stdout.write(d));
    }).on('error', ()=>process.exit(1));
  "
}

piston_post() {
  node -e "
    const http = require('http');
    const data = JSON.stringify($2);
    const req = http.request({hostname:'localhost',port:2000,path:'$1',method:'POST',
      headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}},
      res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>process.stdout.write(d)); });
    req.write(data); req.end();
  "
}

echo "Waiting for Piston API..."
until piston_get /api/v2/runtimes > /dev/null 2>&1; do
  sleep 1
done
echo "Piston API is up."

# ---- Install runtimes if missing ----
installed=$(piston_get /api/v2/runtimes)

install_if_missing() {
  lang="$1"; ver="$2"
  if echo "$installed" | grep -q "\"$lang\""; then
    echo "[ok] $lang already installed"
    return
  fi
  echo "[installing] $lang $ver ..."
  piston_post /api/v2/packages "{\"language\":\"$lang\",\"version\":\"$ver\"}" || {
    echo "[error] Failed to install $lang $ver"; return 1
  }
  echo "[done] $lang $ver"
}

install_if_missing bash   5.2.0
install_if_missing gcc    10.2.0
install_if_missing python 3.12.0
install_if_missing rust   1.68.2
install_if_missing zig    0.10.1
install_if_missing ruby   3.0.1

# ---- Post-install: wire up Rust sysroot so cargo can find std ----
RUST_BASE=/piston/packages/rust/1.68.2/rust-1.68.2-x86_64-unknown-linux-gnu
SYSROOT_TARGET="$RUST_BASE/rustc/lib/rustlib/x86_64-unknown-linux-gnu"
STD_LIB="$RUST_BASE/rust-std-x86_64-unknown-linux-gnu/lib/rustlib/x86_64-unknown-linux-gnu/lib"

if [ -d "$STD_LIB" ] && [ ! -e "$SYSROOT_TARGET/lib" ]; then
  ln -sf "$STD_LIB" "$SYSROOT_TARGET/lib"
  echo "[ok] Rust sysroot symlink created"
else
  echo "[ok] Rust sysroot already set up"
fi

# ---- Update bash environment with Rust/Zig tool paths ----
cat > /piston/packages/bash/5.2.0/environment << 'ENVEOF'
#!/usr/bin/env bash
export PATH=$PWD/bin:$PATH

RUST_DIR=/piston/packages/rust/1.68.2
if [ -d "$RUST_DIR" ]; then
  export PATH="$RUST_DIR/rust-1.68.2-x86_64-unknown-linux-gnu/cargo/bin:$RUST_DIR/rust-1.68.2-x86_64-unknown-linux-gnu/rustc/bin:$PATH"
  export RUST_INSTALL_LOC="$RUST_DIR/rust-1.68.2-x86_64-unknown-linux-gnu"
fi

ZIG_DIR=/piston/packages/zig/0.10.1
if [ -d "$ZIG_DIR" ]; then
  export PATH="$ZIG_DIR/bin:$PATH"
fi

RUBY_DIR=/piston/packages/ruby/3.0.1
if [ -d "$RUBY_DIR" ]; then
  export PATH="$RUBY_DIR/bin:$PATH"
fi
ENVEOF
echo "[ok] Bash environment updated"

echo ""
echo "Piston ready."

# ---- Wait on API process ----
wait $PISTON_PID
