import type {GameRepository, SavedGame} from './gameRepository'

const DB_NAME = 'the-guest-list'
const DB_VERSION = 1
const STORE_NAME = 'games'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function createIndexedDbGameRepository(): GameRepository {
  async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await openDb()
    try {
      const tx = db.transaction(STORE_NAME, mode)
      return await requestToPromise(fn(tx.objectStore(STORE_NAME)))
    } finally {
      db.close()
    }
  }

  return {
    async list() {
      return withStore('readonly', (store) => store.getAll())
    },
    async get(id) {
      return withStore('readonly', (store) => store.get(id)) as Promise<SavedGame | undefined>
    },
    async save(game) {
      const plain = JSON.parse(JSON.stringify(game)) as SavedGame
      await withStore('readwrite', (store) => store.put(plain))
    },
    async remove(id) {
      await withStore('readwrite', (store) => store.delete(id))
    },
  }
}
