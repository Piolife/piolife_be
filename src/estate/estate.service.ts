/**
 * estate.service.ts — NEW
 * Handles Pioland property orders, instalment payments, and tracker logic.
 */
import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EstateOrder, EstateOrderDocument } from './schema/estate-order.schema';
import { CreateEstateOrderDto, MakeInstalmentDto } from './dto/estate.dto';
import { WalletService } from '../wallet/wallet.service';

const DEFAULT_CHARGE = 5000;
const MAX_STRAIGHT_DEFAULTS = 6;
const LOAN_DEDUCTION_RATE = 0.30; // 30% of deposit goes to loan repayment

function addOneMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

@Injectable()
export class EstateService {
  constructor(
    @InjectModel(EstateOrder.name)
    private readonly orderModel: Model<EstateOrderDocument>,
    private readonly walletService: WalletService,
  ) {}

  // ── Create order after first payment ────────────────────────────────────────
  async createOrder(dto: CreateEstateOrderDto): Promise<EstateOrder> {
    const {
      userId, propertyValue, paymentType, instalmentAmount,
    } = dto;

    const firstPayment = paymentType === 'outright'
      ? propertyValue
      : (instalmentAmount ?? 0);

    // Deduct first payment from wallet
    const wallet = await this.walletService.getWalletByUserId(userId);
    if (!wallet || wallet.balance < firstPayment) {
      throw new BadRequestException(
        `Insufficient balance. Required: ₦${firstPayment}, Available: ₦${wallet?.balance ?? 0}`,
      );
    }

    await this.walletService.debit(
      userId,
      firstPayment,
      `Pioland first payment: Plot ${dto.plotNumber}, ${dto.estateName}`,
    );

    const now = new Date();
    const balance = propertyValue - firstPayment;
    const completed = balance <= 0;

    const order = await this.orderModel.create({
      ...dto,
      totalPaid: firstPayment,
      balance,
      timesPaid: 1,
      lastPaymentDate: now,
      nextDueDate: completed ? null : addOneMonth(now),
      completed,
      paymentType,
      agreementDate: dto.agreementDate ? new Date(dto.agreementDate) : now,
      category: dto.category ?? 'pioland',
    });

    return order;
  }

  // ── Make instalment payment ──────────────────────────────────────────────────
  async makeInstalment(
    orderId: string,
    userId: string,
    dto: MakeInstalmentDto,
  ): Promise<EstateOrder> {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Estate order not found.');
    if (order.userId !== userId) {
      throw new BadRequestException('Order does not belong to this user.');
    }
    if (order.revoked) throw new BadRequestException('This deal has been revoked.');
    if (order.completed) throw new BadRequestException('This property is already fully paid.');

    const { amount } = dto;

    // Wallet check
    const wallet = await this.walletService.getWalletByUserId(userId);
    if (!wallet || wallet.balance < amount) {
      throw new BadRequestException(
        `Insufficient balance. Required: ₦${amount}, Available: ₦${wallet?.balance ?? 0}`,
      );
    }

    // Deduct
    await this.walletService.debit(
      userId,
      amount,
      `Pioland instalment: Plot ${order.plotNumber}, ${order.estateName}`,
    );

    const now = new Date();
    const newTotalPaid = order.totalPaid + amount;
    const newBalance = Math.max(order.balance - amount, 0);
    const completed = newBalance <= 0;

    await this.orderModel.findByIdAndUpdate(orderId, {
      totalPaid: newTotalPaid,
      balance: newBalance,
      timesPaid: order.timesPaid + 1,
      lastPaymentDate: now,
      nextDueDate: completed ? null : addOneMonth(now),
      straightDefaultCounter: 0, // reset on successful payment
      completed,
    });

    return this.orderModel.findById(orderId) as any;
  }

  // ── Apply default charge (called by a cron job or admin) ─────────────────────
  async applyDefault(orderId: string): Promise<EstateOrder> {
    const order = await this.orderModel.findById(orderId);
    if (!order || order.completed || order.revoked) return order as any;

    const newStraight = order.straightDefaultCounter + 1;
    const revoked = newStraight >= MAX_STRAIGHT_DEFAULTS;
    const newBalance = order.balance + DEFAULT_CHARGE;
    const newNextDue = addOneMonth(order.nextDueDate ?? new Date());

    await this.orderModel.findByIdAndUpdate(orderId, {
      balance: newBalance,
      totalDefaultCharges: order.totalDefaultCharges + DEFAULT_CHARGE,
      defaultCounter: order.defaultCounter + 1,
      straightDefaultCounter: newStraight,
      revoked,
      nextDueDate: newNextDue,
    });

    return this.orderModel.findById(orderId) as any;
  }

  // ── Queries ──────────────────────────────────────────────────────────────────
  async getOrdersByUser(userId: string): Promise<EstateOrder[]> {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).lean() as any;
  }

  async getOrderById(orderId: string, userId: string): Promise<EstateOrder> {
    const order = await this.orderModel.findOne({ _id: orderId, userId }).lean();
    if (!order) throw new NotFoundException('Estate order not found.');
    return order as any;
  }

  async getAllOrders(): Promise<EstateOrder[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).lean() as any;
  }
}
