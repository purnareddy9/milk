import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { of } from 'rxjs';

describe('CartService Signals & Calculations', () => {
  let service: CartService;
  let mockApi: any;
  let mockToast: any;

  beforeEach(() => {
    mockApi = {
      get: jest.fn().mockReturnValue(of(null)),
      post: jest.fn().mockReturnValue(of({ success: true })),
      patch: jest.fn().mockReturnValue(of({ success: true })),
      delete: jest.fn().mockReturnValue(of({ success: true })),
    };

    mockToast = {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: ApiService, useValue: mockApi },
        { provide: ToastService, useValue: mockToast },
      ],
    });

    service = TestBed.inject(CartService);
    // Clear localStorage for tests
    localStorage.clear();
  });

  it('should initialize with an empty cart state', () => {
    const cart = service.cartSignal();
    expect(cart.items.length).toBe(0);
    expect(cart.subtotal).toBe(0);
    expect(cart.itemCount).toBe(0);
  });

  it('should add items and calculate subtotal and delivery fee correctly', () => {
    const mockProduct: any = {
      id: 'prod_cow_1l',
      name: 'Pure Desi Cow Milk',
      price: 64,
      subscriptionPrice: 58,
      unit: '1L',
      imageUrl: 'https://example.com/cow.jpg',
    };

    service.addToCart(mockProduct, 2);

    const cart = service.cartSignal();
    expect(cart.items.length).toBe(1);
    expect(cart.itemCount).toBe(2);
    expect(cart.subtotal).toBe(128); // 64 * 2
    // Below 199 threshold -> delivery fee 25
    expect(cart.deliveryFee).toBe(25);
    expect(cart.estimatedTotal).toBe(153);
  });

  it('should grant free delivery when subtotal is above ₹199', () => {
    const mockProduct: any = {
      id: 'prod_ghee',
      name: 'Vedic Bilona Ghee',
      price: 650,
      subscriptionPrice: 620,
      unit: '500ml',
      imageUrl: 'https://example.com/ghee.jpg',
    };

    service.addToCart(mockProduct, 1);

    const cart = service.cartSignal();
    expect(cart.subtotal).toBe(650);
    expect(cart.deliveryFee).toBe(0); // Free delivery
    expect(cart.estimatedTotal).toBe(650);
  });
});
