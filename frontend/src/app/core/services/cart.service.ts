import { Injectable, signal, computed } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { Product, Cart, CartItem, SubscriptionFrequency } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartSubject = new BehaviorSubject<Cart>({
    id: 'local_cart',
    items: [],
    itemCount: 0,
    subtotal: 0,
    deliveryFee: 0,
    estimatedTotal: 0,
  });

  public cart$ = this.cartSubject.asObservable();
  public cartSignal = signal<Cart>(this.cartSubject.value);

  public isCartDrawerOpen = signal<boolean>(false);

  constructor(
    private readonly api: ApiService,
    private readonly toast: ToastService,
  ) {
    this.loadCart();
  }

  loadCart() {
    this.api.get<Cart>('cart').pipe(
      tap((cart) => {
        if (cart) {
          this.cartSubject.next(cart);
          this.cartSignal.set(cart);
        }
      }),
      catchError(() => {
        // Fallback local cart from localStorage
        const saved = localStorage.getItem('amrit_local_cart');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            this.cartSubject.next(parsed);
            this.cartSignal.set(parsed);
          } catch {}
        }
        return of(null);
      }),
    ).subscribe();
  }

  addToCart(product: Product, quantity: number = 1, isSubscription: boolean = false, frequency?: SubscriptionFrequency) {
    this.api.post<Cart>('cart/add', {
      productId: product.id,
      quantity,
      isSubscription,
      frequency,
    }).pipe(
      tap((cart) => {
        this.cartSubject.next(cart);
        this.cartSignal.set(cart);
        this.toast.success(`Added ${quantity}x ${product.name} to cart!`);
      }),
      catchError(() => {
        // Local state update fallback
        const current = this.cartSubject.value;
        const existingIndex = current.items.findIndex(
          (i) => i.productId === product.id && i.isSubscription === isSubscription,
        );

        let newItems = [...current.items];
        if (existingIndex > -1) {
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
          };
        } else {
          newItems.push({
            id: `item_${Date.now()}`,
            cartId: current.id,
            productId: product.id,
            product,
            quantity,
            isSubscription,
            frequency,
          });
        }

        const subtotal = newItems.reduce((sum, item) => {
          const price = item.isSubscription ? Number(item.product.subscriptionPrice) : Number(item.product.price);
          return sum + price * item.quantity;
        }, 0);

        const updatedCart: Cart = {
          ...current,
          items: newItems,
          itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
          subtotal,
          deliveryFee: subtotal > 199 || subtotal === 0 ? 0 : 25,
          estimatedTotal: subtotal > 0 ? subtotal + (subtotal > 199 ? 0 : 25) : 0,
        };

        this.cartSubject.next(updatedCart);
        this.cartSignal.set(updatedCart);
        localStorage.setItem('amrit_local_cart', JSON.stringify(updatedCart));
        this.toast.success(`Added ${quantity}x ${product.name} to cart!`);
        return of(updatedCart);
      }),
    ).subscribe();
  }

  updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    this.api.put<Cart>(`cart/items/${itemId}`, { quantity }).pipe(
      tap((cart) => {
        this.cartSubject.next(cart);
        this.cartSignal.set(cart);
      }),
      catchError(() => {
        const current = this.cartSubject.value;
        const newItems = current.items.map((i) => (i.id === itemId ? { ...i, quantity } : i));
        const subtotal = newItems.reduce((sum, item) => {
          const price = item.isSubscription ? Number(item.product.subscriptionPrice) : Number(item.product.price);
          return sum + price * item.quantity;
        }, 0);

        const updatedCart: Cart = {
          ...current,
          items: newItems,
          itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
          subtotal,
          deliveryFee: subtotal > 199 || subtotal === 0 ? 0 : 25,
          estimatedTotal: subtotal > 0 ? subtotal + (subtotal > 199 ? 0 : 25) : 0,
        };

        this.cartSubject.next(updatedCart);
        this.cartSignal.set(updatedCart);
        localStorage.setItem('amrit_local_cart', JSON.stringify(updatedCart));
        return of(updatedCart);
      }),
    ).subscribe();
  }

  removeItem(itemId: string) {
    this.api.delete<Cart>(`cart/items/${itemId}`).pipe(
      tap((cart) => {
        this.cartSubject.next(cart);
        this.cartSignal.set(cart);
        this.toast.info('Item removed from cart');
      }),
      catchError(() => {
        const current = this.cartSubject.value;
        const newItems = current.items.filter((i) => i.id !== itemId);
        const subtotal = newItems.reduce((sum, item) => {
          const price = item.isSubscription ? Number(item.product.subscriptionPrice) : Number(item.product.price);
          return sum + price * item.quantity;
        }, 0);

        const updatedCart: Cart = {
          ...current,
          items: newItems,
          itemCount: newItems.reduce((sum, i) => sum + i.quantity, 0),
          subtotal,
          deliveryFee: subtotal > 199 || subtotal === 0 ? 0 : 25,
          estimatedTotal: subtotal > 0 ? subtotal + (subtotal > 199 ? 0 : 25) : 0,
        };

        this.cartSubject.next(updatedCart);
        this.cartSignal.set(updatedCart);
        localStorage.setItem('amrit_local_cart', JSON.stringify(updatedCart));
        this.toast.info('Item removed from cart');
        return of(updatedCart);
      }),
    ).subscribe();
  }

  clearCart() {
    this.api.delete('cart/clear').subscribe();
    const emptyCart: Cart = {
      id: 'local_cart',
      items: [],
      itemCount: 0,
      subtotal: 0,
      deliveryFee: 0,
      estimatedTotal: 0,
    };
    this.cartSubject.next(emptyCart);
    this.cartSignal.set(emptyCart);
    localStorage.removeItem('amrit_local_cart');
  }

  toggleCartDrawer(open?: boolean) {
    this.isCartDrawerOpen.set(open !== undefined ? open : !this.isCartDrawerOpen());
  }
}
