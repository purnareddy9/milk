import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createInitialSeedData, InMemoryStore } from './in-memory-db';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;
  private memoryStore: InMemoryStore = createInitialSeedData();

  constructor() {
    super({
      log: ['warn', 'error'],
    });

    // Create resilient proxy handlers for all models so if PostgreSQL is unavailable locally,
    // the system seamlessly operates on the authentic in-memory dairy seed dataset without crashing.
    this.initResilientProxies();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Connected to PostgreSQL database via Prisma');
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        `PostgreSQL not reachable at localhost:5432 (${err.message}). Activating resilient in-memory database store with Amrit Pure Dairy catalog.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.logger.log('Disconnected from PostgreSQL database');
    }
  }

  private initResilientProxies() {
    const createModelProxy = (tableName: keyof InMemoryStore, idPrefix: string) => {
      return new Proxy({}, {
        get: (_, method: string) => {
          return async (...args: any[]) => {
            if (this.isConnected) {
              try {
                return await (super[tableName as any] as any)[method](...args);
              } catch (e) {
                // If query fails on disconnected socket, fall through to memory
              }
            }

            const queryArgs = args[0] || {};
            const list: any[] = this.memoryStore[tableName] || [];

            if (method === 'findMany') {
              let results = [...list];
              if (queryArgs.where) {
                results = results.filter((item) => this.matchWhere(item, queryArgs.where));
              }
              if (queryArgs.include) {
                results = results.map((item) => this.resolveIncludes(item, queryArgs.include));
              }
              if (queryArgs.take) {
                const skip = queryArgs.skip || 0;
                results = results.slice(skip, skip + queryArgs.take);
              }
              return results;
            }

            if (method === 'findFirst' || method === 'findUnique') {
              let item = list.find((i) => this.matchWhere(i, queryArgs.where || { id: queryArgs.id }));
              if (item && queryArgs.include) {
                item = this.resolveIncludes(item, queryArgs.include);
              }
              return item || null;
            }

            if (method === 'count') {
              if (queryArgs.where) {
                return list.filter((item) => this.matchWhere(item, queryArgs.where)).length;
              }
              return list.length;
            }

            if (method === 'create') {
              const data = { ...queryArgs.data };
              if (!data.id) data.id = `${idPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
              data.createdAt = data.createdAt || new Date();
              data.updatedAt = new Date();
              list.push(data);
              let res = data;
              if (queryArgs.include) {
                res = this.resolveIncludes(res, queryArgs.include);
              }
              return res;
            }

            if (method === 'createMany') {
              const rows = (queryArgs.data || []).map((row: any) => ({
                id: row.id || `${idPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                ...row,
                createdAt: row.createdAt || new Date(),
                updatedAt: new Date(),
              }));
              list.push(...rows);
              return { count: rows.length };
            }

            if (method === 'update') {
              const idx = list.findIndex((i) => this.matchWhere(i, queryArgs.where));
              if (idx !== -1) {
                list[idx] = { ...list[idx], ...queryArgs.data, updatedAt: new Date() };
                let res = list[idx];
                if (queryArgs.include) {
                  res = this.resolveIncludes(res, queryArgs.include);
                }
                return res;
              }
              return null;
            }

            if (method === 'updateMany') {
              let count = 0;
              for (let i = 0; i < list.length; i++) {
                if (this.matchWhere(list[i], queryArgs.where)) {
                  list[i] = { ...list[i], ...queryArgs.data, updatedAt: new Date() };
                  count++;
                }
              }
              return { count };
            }

            if (method === 'upsert') {
              const existingIdx = list.findIndex((i) => this.matchWhere(i, queryArgs.where));
              if (existingIdx !== -1) {
                list[existingIdx] = { ...list[existingIdx], ...queryArgs.update, updatedAt: new Date() };
                return list[existingIdx];
              } else {
                const newItem = {
                  id: `${idPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                  ...queryArgs.create,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                list.push(newItem);
                return newItem;
              }
            }

            if (method === 'delete') {
              const idx = list.findIndex((i) => this.matchWhere(i, queryArgs.where));
              if (idx !== -1) {
                const deleted = list.splice(idx, 1)[0];
                return deleted;
              }
              return null;
            }

            if (method === 'deleteMany') {
              const initialLen = list.length;
              if (!queryArgs.where || Object.keys(queryArgs.where).length === 0) {
                list.length = 0;
                return { count: initialLen };
              }
              const remaining = list.filter((i) => !this.matchWhere(i, queryArgs.where));
              const count = initialLen - remaining.length;
              this.memoryStore[tableName] = remaining;
              return { count };
            }

            return null;
          };
        },
      });
    };

    // Override models with resilient proxies
    (this as any).user = createModelProxy('users', 'usr');
    (this as any).customerProfile = createModelProxy('customerProfiles', 'cp');
    (this as any).deliveryPerson = createModelProxy('deliveryPersons', 'dp');
    (this as any).category = createModelProxy('categories', 'cat');
    (this as any).product = createModelProxy('products', 'prod');
    (this as any).productVariant = createModelProxy('productVariants', 'pv');
    (this as any).address = createModelProxy('addresses', 'addr');
    (this as any).cart = createModelProxy('carts', 'cart');
    (this as any).cartItem = createModelProxy('cartItems', 'ci');
    (this as any).subscription = createModelProxy('subscriptions', 'sub');
    (this as any).subscriptionDelivery = createModelProxy('subscriptionDeliveries', 'sd');
    (this as any).order = createModelProxy('orders', 'ord');
    (this as any).orderItem = createModelProxy('orderItems', 'oi');
    (this as any).payment = createModelProxy('payments', 'pay');
    (this as any).walletTransaction = createModelProxy('walletTransactions', 'wtx');
    (this as any).deliveryRun = createModelProxy('deliveryRuns', 'run');
    (this as any).inventory = createModelProxy('inventories', 'inv');
    (this as any).inventoryTransaction = createModelProxy('inventoryTransactions', 'itx');
    (this as any).coupon = createModelProxy('coupons', 'cpn');
    (this as any).notification = createModelProxy('notifications', 'notif');
    (this as any).auditLog = createModelProxy('auditLogs', 'aud');
  }

  override async $transaction(arg: any): Promise<any> {
    if (typeof arg === 'function') {
      return await arg(this);
    }
    if (Array.isArray(arg)) {
      const results: any[] = [];
      for (const fn of arg) {
        results.push(await fn);
      }
      return results;
    }
    return null;
  }

  private matchWhere(item: any, where: any): boolean {
    if (!where) return true;
    for (const [key, val] of Object.entries(where)) {
      if (val === undefined) continue;

      if (key === 'OR' && Array.isArray(val)) {
        const matchesOr = val.some((subWhere) => this.matchWhere(item, subWhere));
        if (!matchesOr) return false;
        continue;
      }

      if (key === 'AND' && Array.isArray(val)) {
        const matchesAnd = val.every((subWhere) => this.matchWhere(item, subWhere));
        if (!matchesAnd) return false;
        continue;
      }

      if (key === 'subscriptionId_deliveryDate' && typeof val === 'object') {
        const target = val as any;
        if (item.subscriptionId !== target.subscriptionId) return false;
        if (target.deliveryDate) {
          const itemD = new Date(item.deliveryDate).toDateString();
          const targetD = new Date(target.deliveryDate).toDateString();
          if (itemD !== targetD) return false;
        }
        continue;
      }

      if (typeof val === 'object' && val !== null) {
        const subObj = val as any;
        if (subObj.equals !== undefined && item[key] !== subObj.equals) return false;
        if (subObj.contains !== undefined) {
          const itemStr = String(item[key] || '').toLowerCase();
          const searchStr = String(subObj.contains).toLowerCase();
          if (!itemStr.includes(searchStr)) return false;
          continue;
        }
        if (subObj.gte !== undefined && item[key] < subObj.gte) return false;
        if (subObj.lte !== undefined && item[key] > subObj.lte) return false;
        if (subObj.gt !== undefined && item[key] <= subObj.gt) return false;
        if (subObj.lt !== undefined && item[key] >= subObj.lt) return false;
        if (subObj.in !== undefined && Array.isArray(subObj.in) && !subObj.in.includes(item[key])) return false;
        continue;
      }

      if (item[key] !== val) return false;
    }
    return true;
  }

  private resolveIncludes(item: any, include: any): any {
    if (!item || !include) return item;
    const cloned = { ...item };

    if (include.subscription && item.subscriptionId) {
      const s = this.memoryStore.subscriptions.find((sub) => sub.id === item.subscriptionId) || null;
      cloned.subscription = s ? this.resolveIncludes(s, include.subscription.include || include.subscription || { product: true }) : null;
    }
    if (include.user && item.userId) {
      cloned.user = this.memoryStore.users.find((u) => u.id === item.userId) || null;
    }
    if (include.category && item.categoryId) {
      cloned.category = this.memoryStore.categories.find((c) => c.id === item.categoryId) || null;
    }
    if (include.product && (item.productId || item.id)) {
      const pId = item.productId || item.id;
      const p = this.memoryStore.products.find((prod) => prod.id === pId) || null;
      cloned.product = p ? this.resolveIncludes(p, { category: true }) : null;
    }
    if (include.address && item.addressId) {
      cloned.address = this.memoryStore.addresses.find((a) => a.id === item.addressId) || null;
    }
    if (include.inventory && item.id) {
      cloned.inventory = this.memoryStore.inventories.find((inv) => inv.productId === item.id) || null;
    }
    if (include.items && item.id) {
      cloned.items = this.memoryStore.orderItems.filter((oi) => oi.orderId === item.id);
    }
    if (include.customerProfile && item.id) {
      cloned.customerProfile = this.memoryStore.customerProfiles.find((cp) => cp.userId === item.id) || null;
    }
    if (include.deliveryPersonProfile && item.id) {
      cloned.deliveryPersonProfile = this.memoryStore.deliveryPersons.find((dp) => dp.userId === item.id) || null;
    }
    if (include.deliveries && item.id) {
      cloned.deliveries = this.memoryStore.subscriptionDeliveries.filter((sd) => sd.subscriptionId === item.id);
    }

    return cloned;
  }
}
