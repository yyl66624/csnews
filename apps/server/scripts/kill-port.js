/**
 * 释放指定端口（Windows / macOS / Linux）
 * 用法: node scripts/kill-port.js 3000
 */
const { execSync } = require('child_process');

const port = String(process.argv[2] || '3000');

function killOnWindows() {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    out.split(/\r?\n/).forEach((line) => {
      if (!line.includes('LISTENING')) return;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    });
    pids.forEach((pid) => {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
      console.log(`已结束占用端口 ${port} 的进程 PID ${pid}`);
    });
    if (pids.size === 0) {
      console.log(`端口 ${port} 未被占用`);
    }
  } catch {
    console.log(`端口 ${port} 未被占用`);
  }
}

function killOnUnix() {
  try {
    const pid = execSync(`lsof -ti :${port}`, { encoding: 'utf8' }).trim();
    if (pid) {
      execSync(`kill -9 ${pid}`);
      console.log(`已结束占用端口 ${port} 的进程 PID ${pid}`);
    } else {
      console.log(`端口 ${port} 未被占用`);
    }
  } catch {
    console.log(`端口 ${port} 未被占用`);
  }
}

if (process.platform === 'win32') {
  killOnWindows();
} else {
  killOnUnix();
}
