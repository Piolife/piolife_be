import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateMedLabStockDto } from './dto/create-medlab-stock.dto';
import { MedLabStock, MedLabStockDocument } from './schema/medlab-stock.schema';
import {
  TransactionType,
  Wallet,
  WalletDocument,
} from 'src/wallet/schema/wallet.schema';
import { CreateLabOrderDto } from './dto/laborder.dto';
import { WalletService } from 'src/wallet/wallet.service';
import { MedLabOrder, MedLabOrderDocument } from './schema/laborder.schema';

@Injectable()
export class MedLabStockService {
  constructor(
    @InjectModel(MedLabStock.name)
    private stockModel: Model<MedLabStockDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private readonly walletService: WalletService,
    @InjectModel(MedLabOrder.name)
    private readonly labOrderModel: Model<MedLabOrderDocument>,
  ) {}

  async create(
    CreateMedLabStockDto: CreateMedLabStockDto,
    userId: string,
  ): Promise<MedLabStock> {
    const { name } = CreateMedLabStockDto;
    const normalizedName = name.trim().toLowerCase();
    const existing = await this.stockModel.findOne({
      name: normalizedName,
      user: userId,
    });
    if (existing) {
      throw new BadRequestException(`"${name}" already exists for this user.`);
    }

    const newStock = await this.stockModel.create({
      ...CreateMedLabStockDto,
      user: userId,
    });

    return newStock;
  }

  async findAll(userId: string): Promise<MedLabStock[]> {
    return this.stockModel.find({ user: userId });
  }

  async findOne(id: string): Promise<MedLabStock> {
    const issue = await this.stockModel.findById(id);
    if (!issue) {
      throw new NotFoundException('Pharmacy Stock not found');
    }
    return issue;
  }

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

  async findByUser(userId: string): Promise<MedLabStock[]> {
    const stocks = await this.stockModel.find({ user: userId });
    if (!stocks || stocks.length === 0) {
      throw new NotFoundException(`No stock found for user ${userId}`);
    }
    return stocks;
  }

  async createLabOrder(
    createLabOrderDto: CreateLabOrderDto,
  ): Promise<MedLabOrderDocument> {
    const { userId, medLabId, testIds } = createLabOrderDto;

    if (!userId || !medLabId || !testIds.length) {
      throw new BadRequestException(
        'userId, medLabId, and testIds are required.',
      );
    }

    // 1. Fetch all tests
    const tests = await this.stockModel.find({
      _id: { $in: testIds },
      user: medLabId,
    });

    if (!tests.length) {
      throw new NotFoundException('No valid lab tests found.');
    }

    // 2. Calculate total cost
    const totalPrice = tests.reduce((sum, t) => sum + t.price, 0);

    // 3. Get wallets
    const userWallet = await this.walletService.getWalletByUserId(userId);
    const medLabWallet = await this.walletService.getWalletByUserId(medLabId);

    if (!userWallet || !medLabWallet) {
      throw new NotFoundException('User or MedLab wallet not found.');
    }

    // 4. Check balance + loanBalance
    const availableFunds = userWallet.balance;
    if (availableFunds < totalPrice) {
      throw new BadRequestException('Insufficient funds');
    }

    // 5. Debit user wallet
    let remainingDebit = totalPrice;

    if (userWallet.balance >= remainingDebit) {
      userWallet.balance -= remainingDebit;
      remainingDebit = 0;
    }

    userWallet.transactions.push({
      amount: totalPrice,
      type: TransactionType.LAB_TEST_PAYMENT,
      reason: 'Lab test purchase',
      description: `Paid for lab tests: ${tests.map((t) => t.name).join(', ')}`,
      timestamp: new Date(),
    });

    await userWallet.save();

    // 6. Credit MedLab wallet
    medLabWallet.balance += totalPrice;
    medLabWallet.transactions.push({
      amount: totalPrice,
      type: TransactionType.LAB_TEST_REVENUE,
      reason: 'Lab test fee received',
      description: `Received payment from user: ${userId}`,
      timestamp: new Date(),
    });

    await medLabWallet.save();

    // 7. Save order
    const labOrder = await this.labOrderModel.create({
      userId,
      medLabId,
      testIds,
      totalAmount: totalPrice,
      status: 'completed',
    });

    return labOrder;
  }
}
