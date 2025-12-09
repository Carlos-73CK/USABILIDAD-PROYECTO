export {}

declare global {
  // Utilidad simple: todas las props readonly (shallow)
  type ReadonlyProps<T> = {
    readonly [K in keyof T]: T[K]
  }
}
