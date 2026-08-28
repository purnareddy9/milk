import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
  private settings = {
    businessName: 'Amrit Pure Dairy & Organic Farms',
    brandTagline: 'Farm to Doorstep Before 7:00 AM',
    supportPhone: '+91 98765 43210',
    supportEmail: 'care@amritpuredairy.com',
    farmAddress: 'Amrit Organic Farms, Village Chhatarpur, Dairy Zone 4, Haryana',
    fssaiLicense: '10822005000124',
    deliverySlots: [
      { id: 'MORNING_5_30_7_30', name: 'Early Morning', window: '5:30 AM – 7:30 AM', cutoffTime: '10:00 PM (Previous Night)', isActive: true },
      { id: 'EVENING_5_00_7_00', name: 'Evening', window: '5:00 PM – 7:00 PM', cutoffTime: '2:00 PM (Same Day)', isActive: true },
    ],
    deliveryFeeSettings: {
      freeDeliveryThreshold: 199,
      standardDeliveryFee: 25,
    },
    pincodesServed: ['122001', '122002', '122003', '122017', '122018', '110001', '110016', '110070'],
    subscriptionDiscountsPercent: 10,
  };

  async getSettings() {
    return this.settings;
  }

  async updateSettings(updated: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...updated };
    return this.settings;
  }
}
