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

  async createLabOrder(dto: CreateLabOrderDto): Promise<any> {
    const { testIds, userId, labId, diagnosisNote } = dto;

    // Fetch all selected tests
    const tests = await this.stockModel.find({
      _id: { $in: testIds as any },
      user: labId,
    });

    if (!tests.length) {
      throw new NotFoundException('No matching tests found for this lab.');
    }

    const totalAmount = tests.reduce((sum, t) => sum + (t.price ?? 0), 0);

    // Deduct from patient wallet
    const userWallet = await this.walletService.getWalletByUserId(userId);
    if (!userWallet || userWallet.balance < totalAmount) {
      throw new BadRequestException(
        `Insufficient balance. Required: ₦${totalAmount}`,
      );
    }
    userWallet.balance -= totalAmount;
    userWallet.transactions.push({
      amount: totalAmount,
      type: TransactionType.LAB_TEST_PAYMENT,
      description: `Lab tests ordered from lab ${labId}`,
      timestamp: new Date(),
    });
    await userWallet.save();

    // Credit lab wallet
    const labWallet = await this.walletService.getWalletByUserId(labId);
    if (labWallet) {
      labWallet.balance += totalAmount;
      labWallet.transactions.push({
        amount: totalAmount,
        type: TransactionType.LAB_TEST_REVENUE,
        description: `Lab order payment from patient ${userId}`,
        timestamp: new Date(),
      });
      await labWallet.save();
    }

    // Save order — include diagnosisNote so lab sees doctor's instructions
    // Also embed test name/price so medlabServices.tsx can render them
    const order = await this.labOrderModel.create({
      userId,
      medLabId: labId,
      testIds,
      tests: tests.map((t) => ({ _id: t._id, name: t.name, price: t.price })),
      totalAmount,
      status: 'pending',
      diagnosisNote,
    } as any);

    return {
      success: true,
      message: 'Lab tests booked. The lab has been notified.',
      orderId: order._id,
      totalAmount,
      diagnosisNote: diagnosisNote ?? '',
    };
  }
  async getOrdersByLab(labId: string): Promise<any[]> {
    return this.labOrderModel.find({ medLabId: labId }).sort({ createdAt: -1 }).lean();
  }
}
