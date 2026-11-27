import { createStore, useSelector } from "@tanstack/react-store";

export type CartItem = {
  barangId: number;
  nama: string;
  satuan: string;
  hargaJual: number;
  jumlah: number;
};
type CartState = { items: CartItem[] };

export const cartStore = createStore<CartState>({
  items: [],
});
export const useCart = () => useSelector(cartStore, (state) => state.items);
export function addCartItem(item: CartItem) {
  cartStore.setState((state) => {
    const existing = state.items.find(
      (entry) => entry.barangId === item.barangId,
    );
    if (existing)
      return {
        items: state.items.map((entry) =>
          entry.barangId === item.barangId
            ? {
                ...entry,
                jumlah: entry.jumlah + item.jumlah,
              }
            : entry,
        ),
      };
    return { items: [...state.items, item] };
  });
}
export function removeCartItem(barangId: number) {
  cartStore.setState((state) => ({
    items: state.items.filter((item) => item.barangId !== barangId),
  }));
}
export function clearCart() {
  cartStore.setState(() => ({ items: [] }));
}
