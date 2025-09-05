"use strict";
const electron = require("electron");
const fs = require("node:fs");
const path = require("node:path");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
async function ensureStore(name) {
  const udp = await electron.ipcRenderer.invoke("get-userdata-path");
  const storePath = path.join(udp, "_ndxstore");
  if (!fs.existsSync(storePath)) {
    fs.mkdirSync(storePath, { recursive: true });
  }
  const storeFilePath = path.join(storePath, name);
  if (!fs.existsSync(storeFilePath)) {
    fs.writeFileSync(storeFilePath, "");
  }
  return storeFilePath;
}
electron.contextBridge.exposeInMainWorld("electronAPI", {
  getUserDataPath: () => electron.ipcRenderer.invoke("get-userdata-path"),
  readFile: function(path2) {
    return fs.readFileSync(path2);
  },
  ensureStore,
  writeStore: async function(name, data) {
    const path2 = await ensureStore(name);
    fs.writeFileSync(path2, Buffer.from(data));
    return path2;
  },
  readStore: async function(name) {
    const path2 = await ensureStore(name);
    return fs.readFileSync(path2);
  }
});
