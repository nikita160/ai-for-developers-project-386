/**
 * TypeScript 5.9's DOM lib omits the iterator members of `URLSearchParams`
 * (`entries`, `keys`, `values`, `Symbol.iterator`) even though every runtime
 * (browsers and Node) provides them. The generated SDK relies on `entries()`,
 * so this augmentation restores the spec'd surface for type-checking.
 */
interface URLSearchParams {
  /** Returns an iterator over `[name, value]` pairs. */
  entries(): IterableIterator<[string, string]>
  /** Returns an iterator over parameter names. */
  keys(): IterableIterator<string>
  /** Returns an iterator over parameter values. */
  values(): IterableIterator<string>
  [Symbol.iterator](): IterableIterator<[string, string]>
}
