import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BuyStockDto, CreatePharmacyStockDto } from './dto/create-pharmacy-stock.dto';
import { UpdatePharmacyStockDto } from './dto/update-pharmacy-stock.dto';
import { PharmacyStock, PharmacyStockDocument } from './schema/pharmacy-stock.schema';
import { TransactionType, Wallet, WalletDocument } from 'src/wallet/schema/wallet.schema';

@Injectable()
export class PharmacyStockService {
  constructor(
    @InjectModel(PharmacyStock.name) private stockModel: Model<PharmacyStockDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,

  ) {}

  async create(createPharmacyStockDto: CreatePharmacyStockDto): Promise<PharmacyStock> {
    const { name } = createPharmacyStockDto;

    const existing = await this.stockModel.findOne({ name });
    if (existing) {
      throw new BadRequestException(`A Pharmacy stock with the name: ${name} already exists`);
    }

    const createdIssue = new this.stockModel(createPharmacyStockDto);
    return createdIssue.save();
  }

  async findAll(): Promise<PharmacyStock[]> {
    return this.stockModel.find().sort({ _id: -1 }).exec();
  }
  
  
async buyItem(stockId: string, quantity: number, userId: string) {
    const item = await this.stockModel.findById(stockId);
    if (!item) throw new NotFoundException('Stock item not found');
  
    if (item.quantity < quantity) {
      throw new BadRequestException('Not enough stock available');
    }
  
    const totalPrice = item.price * quantity;
  
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) throw new NotFoundException('Wallet not found');
  
    if (wallet.balance < totalPrice) {
      throw new BadRequestException('Insufficient wallet balance');
    }
  
    // Deduct wallet balance
    wallet.balance -= totalPrice;
    // Add transaction log
    wallet.transactions.push({
      amount: totalPrice,
      type: TransactionType.STOCK_PURCHASE,
      description: `Purchased ${quantity} unit${quantity > 1 ? 's' : ''} of ${item.name}`,
      timestamp: new Date(),
    });
  
    // Update stock
    item.quantity -= quantity;
    item.status = item.quantity === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE';
  
    await Promise.all([wallet.save(), item.save()]);
  
    return {
      message: 'Purchase successful',
      itemName: item.name,
      quantityBought: quantity,
      totalAmountCharged: totalPrice,
      remainingWalletBalance: wallet.balance,
    };
  }
  

  async findOne(id: string): Promise<PharmacyStock> {
    const issue = await this.stockModel.findById(id);
    if (!issue) {
      throw new NotFoundException('Pharmacy Stock not found');
    }
    return issue;
  }
  

// pharmacy.service.ts

async updateStock(id: string, updateDto: Partial<PharmacyStock>) {
    const stock = await this.stockModel.findById(id);
    if (!stock) throw new NotFoundException('Stock not found');
  
    if (updateDto.name) stock.name = updateDto.name;
    if (updateDto.price !== undefined) stock.price = updateDto.price;
    if (updateDto.description) stock.description = updateDto.description;
    if (updateDto.image) stock.image = updateDto.image;
  
    if (updateDto.quantity !== undefined) {
      stock.quantity += updateDto.quantity; 
      stock.status = stock.quantity > 0 ? 'AVAILABLE' : 'OUT_OF_STOCK';
    }
  
    return stock.save();
  }
  
  

  async delete(id: string): Promise<{ message: string }> {
    const result = await this.stockModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Pharmacy not found');
    }
    return { message: 'Pharmacy Stock deleted successfully' };
  }
}
