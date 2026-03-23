// ── Cart Utility (localStorage-backed) ────────────────────────────────
const STORAGE_KEY = "zentory-cart"

export interface CartItem {
  id: string
  type: "material"
  materialId?: string
  number: string
  materialName: string
  supplierName: string
  supplierId: string
  articleNumber: string
  purchasePrice: number
  orderUnit: string
  quantity: number
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function addToCart(item: CartItem) {
  const items = getCart()
  const existing = items.find((i) => i.id === item.id)
  if (existing) {
    existing.quantity += item.quantity
  } else {
    items.push(item)
  }
  saveCart(items)
  // Dispatch a storage event so other tabs / components can react
  window.dispatchEvent(new Event("cart-updated"))
  return items
}

export function removeFromCart(id: string) {
  const items = getCart().filter((i) => i.id !== id)
  saveCart(items)
  window.dispatchEvent(new Event("cart-updated"))
  return items
}

export function clearCart() {
  saveCart([])
  window.dispatchEvent(new Event("cart-updated"))
}
