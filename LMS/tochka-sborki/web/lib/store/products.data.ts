// CANONICAL FOR THE WEB SIDE — keep in sync with workers/src/lib/products.ts.
// Worker and web do not share imports (separate build roots); this is a deliberate copy.
// The worker prices the Checkout Session from ITS copy; these fields are display-only.
export interface StoreProduct {
  id: string
  priceCents: number
  name:  { ru: string; en: string }
  blurb: { ru: string; en: string }
}

export const STORE_PRODUCTS: StoreProduct[] = []   // owner fills; empty = coming-soon
