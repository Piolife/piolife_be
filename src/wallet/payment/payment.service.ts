import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class PaymentService {
  constructor(private readonly walletService: WalletService) {}

  async makePayment(userId: string, phone: string, price: number, plan: number): Promise<any> {
    try {
      function generateUniqueRequestID(): string {
        // Generate a unique identifier based on the current timestamp
        const timestamp = new Date().getTime();
        return `request_${timestamp}`;
      }

      const uniqueRequestID = generateUniqueRequestID();

      const data = new FormData();
      data.append('serviceID', 'test_pay');
      data.append('price', price);
      data.append('api', 'ap_ecdde6431a746c336c3fc585ffbec5df');
      data.append('plan', plan);
      data.append('phone', phone);
      data.append('requestID', uniqueRequestID);

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://gsubz.com/api/testpay/',
        headers: {
          Authorization: 'Bearer ap_ecdde6431a746c336c3fc585ffbec5df',
          ...data.getHeaders(),
        },
        data: data,
      };

      const response = await axios(config);

      const paidAmount = price;
      // Pass the payload as an argument to the withdraw method
      await this.walletService.withdraw(userId, paidAmount, {
        phone,
        plan,
        price,
        serviceID: 'test_pay',
      });

      console.log(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}