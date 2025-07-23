import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMedLabStockDto } from './dto/create-medlab-stock.dto';
import { MedLabStock, MedLabStockDocument } from './schema/medlab-stock.schema';
import { Wallet, WalletDocument } from 'src/wallet/schema/wallet.schema';

@Injectable()
export class MedLabStockService {
  constructor(
    @InjectModel(MedLabStock.name)
    private stockModel: Model<MedLabStockDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async create(
    CreateMedLabStockDto: CreateMedLabStockDto,
    userId: string,
  ): Promise<MedLabStock> {
    const { name } = CreateMedLabStockDto;

    const existing = await this.stockModel.findOne({ name, user: userId });
    if (existing) {
      throw new BadRequestException(`"${name}" already exists for this user.`);
    }

    const newStock = await this.stockModel.create({
      ...CreateMedLabStockDto,
      user: userId,
    });

    return newStock;
  }

  // async findAll(): Promise<PharmacyStock[]> {
  //   return this.stockModel.find().sort({ _id: -1 }).exec();
  // }
  async findAll(userId: string): Promise<MedLabStock[]> {
    return this.stockModel.find({ user: userId });
  }

  // async buyItem(stockId: string, quantity: number, userId: string) {
  //   const item = await this.stockModel.findById(stockId);
  //   if (!item) throw new NotFoundException('Stock item not found');

  //   if (item.quantity < quantity) {
  //     throw new BadRequestException('Not enough stock available');
  //   }

  //   const totalPrice = item.price * quantity;

  //   const wallet = await this.walletModel.findOne({ userId });
  //   if (!wallet) throw new NotFoundException('Wallet not found');

  //   if (wallet.balance < totalPrice) {
  //     throw new BadRequestException('Insufficient wallet balance');
  //   }

  //   // Deduct wallet balance
  //   wallet.balance -= totalPrice;
  //   // Add transaction log
  //   wallet.transactions.push({
  //     amount: totalPrice,
  //     type: TransactionType.STOCK_PURCHASE,
  //     description: `Purchased ${quantity} unit${quantity > 1 ? 's' : ''} of ${item.name}`,
  //     timestamp: new Date(),
  //   });

  //   // Update stock
  //   item.quantity -= quantity;
  //   item.status = item.quantity === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE';

  //   await Promise.all([wallet.save(), item.save()]);

  //   return {
  //     message: 'Purchase successful',
  //     itemName: item.name,
  //     quantityBought: quantity,
  //     totalAmountCharged: totalPrice,
  //     remainingWalletBalance: wallet.balance,
  //   };
  // }

  async findOne(id: string): Promise<MedLabStock> {
    const issue = await this.stockModel.findById(id);
    if (!issue) {
      throw new NotFoundException('Pharmacy Stock not found');
    }
    return issue;
  }

  // pharmacy.service.ts

  async updateStock(id: string, updateDto: Partial<MedLabStock>) {
    const stock = await this.stockModel.findById(id);
    if (!stock) throw new NotFoundException('Stock not found');

    if (updateDto.name) stock.name = updateDto.name;
    if (updateDto.price !== undefined) stock.price = updateDto.price;
    return stock.save();
  }

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.stockModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Test not found');
    }
    return { message: 'test deleted successfully' };
  }
}
