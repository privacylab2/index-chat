import { ipcRenderer, contextBridge } from 'electron'
import { sha256 } from 'hash-wasm'
import fs from 'node:fs'
import path from 'node:path'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

async function ensureStore(name: string) {
  const udp = await ipcRenderer.invoke('get-userdata-path')
  const storePath = path.join(udp, '_ndxstore')
  if (!fs.existsSync(storePath)) {
    fs.mkdirSync(storePath, { recursive: true })
  }

  const storeFilePath: string = path.join(storePath, name)
  if (!fs.existsSync(storeFilePath)) {
    fs.writeFileSync(storeFilePath, "");
  }
  return storeFilePath
}

const ALLOW_ARBTIRARY_READ = true;


contextBridge.exposeInMainWorld('electronAPI', {
  getUserDataPath: () => ipcRenderer.invoke('get-userdata-path'),
  readFile: function (path: string) {
    if (ALLOW_ARBTIRARY_READ) return fs.readFileSync(path); else throw new Error("Arbitrary read access disabled.")
  },
  ensureStore,

  writeStore: async function (name: string, data: Uint8Array): Promise<string> {
    const path = await ensureStore(name);
    fs.writeFileSync(path, Buffer.from(data))
    return path;
  },

  readStore: async function (name: string): Promise<Uint8Array> {
    const path: string = await ensureStore(name);
    return fs.readFileSync(path);
  },

  dangerousDeleteStore: async function (name: string, sha256Confirmation: string) {
    try {
      if (await sha256(name) == sha256Confirmation) {
        const udp = await ipcRenderer.invoke('get-userdata-path')
        const storePath = path.join(udp, '_ndxstore')
        if (!fs.existsSync(storePath)) {
          fs.mkdirSync(storePath, { recursive: true })
        }

        const storeFilePath: string = path.join(storePath, name)
        fs.unlinkSync(storeFilePath)
        return true
      } else {
        return false
      }
    } catch (e) {
      console.error(e)
      return false
    }

  }
})
