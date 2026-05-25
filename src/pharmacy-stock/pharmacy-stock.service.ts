/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePharmacyStockDto } from './dto/create-pharmacy-stock.dto';
import {
  PharmacyStock,
  PharmacyStockDocument,
} from './schema/pharmacy-stock.schema';
import {
  TransactionType,
  Wallet,
  WalletDocument,
} from 'src/wallet/schema/wallet.schema';
import { User, UserDocument } from 'src/user/Schema/user.schema';
import {
  PharmacySale,
  PharmacySaleDocument,
} from './schema/pharmacyOrder.schema';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class PharmacyStockService {
  constructor(
    @InjectModel(PharmacyStock.name)
    private stockModel: Model<PharmacyStockDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Wallet.name)
    private walletModel: Model<WalletDocument>,

    @InjectModel(PharmacySale.name)
    private pharmacySaleModel: Model<PharmacySaleDocument>,

    private readonly walletService: WalletService,
  ) {}

  async createOrder(
    drugIds: string[],
    userId: string,
    pharmacyId: string,
    quantities?: Record<string, number>,
    withDelivery?: boolean,
    prescriptionId?: string,
  ): Promise<any> {
<<<<<<< HEAD
    // Fetch all selected drugs
    const drugs = await this.stockModel.find({
      _id: { $in: drugIds as any },
=======
    // Fetch all selected drugs (user field = pharmacy owner's id)
    const drugs = await this.stockModel.find({
      _id: { $in: drugIds },
>>>>>>> 81c49ff (fix: sync backend with frontend — add missing endpoints and fix model refs)
      user: pharmacyId,
    });

    if (!drugs.length) {
      throw new NotFoundException('No matching drugs found for this pharmacy.');
    }

    // If quantities map provided, multiply each drug price × qty; else count as 1
    const totalAmount = drugs.reduce((sum, d) => {
      const qty = quantities ? (quantities[d._id.toString()] ?? 1) : 1;
      return sum + (d.price ?? 0) * qty;
    }, 0);

    // Deduct from buyer wallet (direct model access — same pattern as buyItems)
    const userWallet = await this.walletModel.findOne({ userId });
    if (!userWallet || userWallet.balance < totalAmount) {
      throw new BadRequestException(
        `Insufficient balance. Required: ₦${totalAmount}, Available: ₦${userWallet?.balance ?? 0}`,
      );
    }
<<<<<<< HEAD
    userWallet.balance -= totalAmount;
    userWallet.transactions.push({
      amount: totalAmount,
      type: TransactionType.STOCK_PURCHASE,
      description: `Drug order from pharmacy ${pharmacyId}`,
      timestamp: new Date(),
    });
=======
    (userWallet as any).balance -= totalAmount;
    (userWallet as any).transactions = [
      ...((userWallet as any).transactions ?? []),
      {
        amount: totalAmount,
        type: 'STOCK_PURCHASE',
        description: `Drug order from pharmacy`,
        timestamp: new Date(),
      },
    ];
>>>>>>> 81c49ff (fix: sync backend with frontend — add missing endpoints and fix model refs)
    await userWallet.save();

    // Credit pharmacy wallet
    const pharmacyWallet = await this.walletModel.findOne({ userId: pharmacyId });
    if (pharmacyWallet) {
<<<<<<< HEAD
      pharmacyWallet.balance += totalAmount;
      pharmacyWallet.transactions.push({
        amount: totalAmount,
        type: TransactionType.STOCK_SALE,
        description: `Drug order from client ${userId}`,
        timestamp: new Date(),
      });
      await pharmacyWallet.save();
    }

    // Save order record
    const order = await this.pharmacySaleModel.create({
      userId,
      practitionerId: pharmacyId,
      items: drugs.map((d) => ({ stockId: (d as any)._id, name: d.name, quantity: 1, price: d.price, total: d.price })),
      totalAmount,
      status: 'pending',
    } as any);
=======
      (pharmacyWallet as any).balance += totalAmount;
      (pharmacyWallet as any).transactions = [
        ...((pharmacyWallet as any).transactions ?? []),
        {
          amount: totalAmount,
          type: 'STOCK_SALE',
          description: `Drug order from client`,
          timestamp: new Date(),
        },
      ];
      await pharmacyWallet.save();
    }

    // Save sale record using PharmacySale (the only order model registered)
    const sale = await this.pharmacySaleModel.create({
      userId,
      practitionerId: pharmacyId,
      items: drugs.map((d) => ({
        stockId: d._id,
        name: d.name,
        quantity: quantities ? (quantities[d._id.toString()] ?? 1) : 1,
        price: d.price,
        total: (d.price ?? 0) * (quantities ? (quantities[d._id.toString()] ?? 1) : 1),
      })),
      totalAmount,
      status: 'pending',
      // Extra fields stored as metadata (schema is flexible via timestamps)
      ...(withDelivery !== undefined && { withDelivery }),
      ...(prescriptionId && { prescriptionId }),
    });
>>>>>>> 81c49ff (fix: sync backend with frontend — add missing endpoints and fix model refs)

    return {
      success: true,
      message: 'Order placed successfully. Pharmacy notified.',
      orderId: sale._id,
      totalAmount,
    };
  }

  async create(
    createPharmacyStockDto: CreatePharmacyStockDto,
    userId: string,
  ): Promise<PharmacyStock> {
    const { name } = createPharmacyStockDto;

    const existing = await this.stockModel.findOne({ name, user: userId });
    if (existing) {
      throw new BadRequestException(
        `Pharmacy stock "${name}" already exists for this user.`,
      );
    }

    const newStock = await this.stockModel.create({
      ...createPharmacyStockDto,
      user: userId,
    });

    return newStock;
  }

  async findAll(userId: string): Promise<PharmacyStock[]> {
    return this.stockModel.find({ user: userId });
  }

  async buyItems(
    items: { stockId: string; quantity: number }[],
    userId: string,
    practitionerId: string,
  ) {
    // 1. Get wallets
    const userWallet = await this.walletModel.findOne({ userId });
    const practitionerWallet = await this.walletModel.findOne({
      userId: practitionerId,
    });

    if (!userWallet || !practitionerWallet) {
      throw new NotFoundException('User or Practitioner wallet not found');
    }

    // 2. Prepare totals
    let totalCost = 0;
    const purchases: {
      stockItem: PharmacyStockDocument;
      quantity: number;
      itemCost: number;
    }[] = [];

    // 3. Check stock availability and calculate total price
    for (const { stockId, quantity } of items) {
      const stockItem = await this.stockModel.findById(stockId);
      if (!stockItem)
        throw new NotFoundException(`Stock item ${stockId} not found`);

      if (stockItem.quantity < quantity) {
        throw new BadRequestException(
          `Not enough stock available for ${stockItem.name}`,
        );
      }

      const itemCost = stockItem.price * quantity;
      totalCost += itemCost;

      purchases.push({ stockItem, quantity, itemCost });
    }

    // 4. Check available funds once (for all items combined)
    const availableFunds = userWallet.balance;
    if (availableFunds < totalCost) {
      throw new BadRequestException('Insufficient balance');
    }

    // 5. Debit from user wallet
    let remainingDebit = totalCost;

    if (userWallet.balance >= remainingDebit) {
      userWallet.balance -= remainingDebit;
      remainingDebit = 0;
    }

    userWallet.transactions.push({
      amount: totalCost,
      type: TransactionType.STOCK_PURCHASE,
      reason: 'Purchased multiple items',
      description: `Purchased ${purchases.length} items`,
      timestamp: new Date(),
    });

    // 6. Credit practitioner wallet
    practitionerWallet.balance += totalCost;
    practitionerWallet.transactions.push({
      amount: totalCost,
      type: TransactionType.STOCK_SALE,
      reason: 'Stock items sold',
      description: `Sold ${purchases.length} items to user: ${userId}`,
      timestamp: new Date(),
    });

    // 7. Update each stock item
    for (const { stockItem, quantity } of purchases) {
      stockItem.quantity -= quantity;
      stockItem.status =
        stockItem.quantity === 0 ? 'OUT_OF_STOCK' : 'AVAILABLE';
      await stockItem.save();
    }

    // 8. Save wallet changes
    await Promise.all([userWallet.save(), practitionerWallet.save()]);

    // 9. Update practitioner’s sales count (for multiple purchases, increment by items.length)
    await this.userModel.updateOne(
      { _id: practitionerId as any },
      { $inc: { consultationCount: purchases.length } },
    );

    // 10. Save sales record
    await this.pharmacySaleModel.create({
      userId,
      practitionerId,
      items: purchases.map((p) => ({
        stockId: p.stockItem._id,
        name: p.stockItem.name,
        quantity: p.quantity,
        price: p.stockItem.price,
        total: p.itemCost,
      })),
      totalAmount: totalCost,
      status: 'completed',
    });

    return {
      message: 'Purchase successful',
      totalAmountCharged: totalCost,
      purchasedItems: purchases.map((p) => ({
        itemName: p.stockItem.name,
        quantity: p.quantity,
        totalPrice: p.itemCost,
      })),
      remainingWalletBalance: userWallet.balance,
      remainingLoanBalance: userWallet.loanBalance,
    };
  }
  async getOrdersByPharmacy(pharmacyId: string): Promise<any[]> {
<<<<<<< HEAD
    return this.pharmacySaleModel.find({ practitionerId: pharmacyId }).sort({ createdAt: -1 }).lean();
=======
    return this.pharmacySaleModel
      .find({ practitionerId: pharmacyId })
      .sort({ createdAt: -1 })
      .lean();
>>>>>>> 81c49ff (fix: sync backend with frontend — add missing endpoints and fix model refs)
  }
  async getSales(practitionerId: string) {
    const sales = await this.pharmacySaleModel
      .find({ practitionerId })
      .sort({ createdAt: -1 }); // 👈 newest first

    return sales;
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
