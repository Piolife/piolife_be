/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from 'src/wallet/schema/wallet.schema';
import {
  EmergencyStock,
  EmergencyStockDocument,
} from './schema/emergency.schema';
import {
  CallEmergencyFormData,
  geoLocationDto,
} from './dto/create-emergency-dto';
import axios from 'axios';
import { WalletService } from 'src/wallet/wallet.service';
import { User, UserDocument } from 'src/user/Schema/user.schema';
import { UserRole } from 'src/user/enum/user.enum';
import { getDistanceFromLatLonInKm } from 'utils/haversine';
import { StreamService } from 'src/stream/stream.service';

@Injectable()
export class EmergencyStockService {
  constructor(
    @InjectModel(EmergencyStock.name)
    private stockModel: Model<EmergencyStockDocument>,

    @InjectModel(Wallet.name)
    private walletModel: Model<WalletDocument>,

    private readonly walletService: WalletService, // ✅ Injected here

    @InjectModel(User.name) // ✅ If you want to find nearest providers
    private readonly userModel: Model<UserDocument>,

    @InjectModel(EmergencyStock.name)
    private readonly emergencyStockModel: Model<EmergencyStockDocument>,

    private readonly streamService: StreamService,
  ) {}

  async geocodeAddress(formData: geoLocationDto) {
    const fullAddress = `${formData.address}, ${formData.ward}, ${formData.lga}, ${formData.state}`;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
    const res = await axios.get(url);
    if (res.data.status !== 'OK') {
      throw new BadRequestException(
        'Unable to find location for the given address',
      );
    }

    const location = res.data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng,
    };
  }

  async handleEmergencyRequest(
    userId: string,
    formData: CallEmergencyFormData,
  ) {
    // 1️⃣ Geocode the incident location
    const fullAddress = `${formData.address}, ${formData.ward}, ${formData.lga}, ${formData.state}`;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
    const res = await axios.get(url);

    if (res.data.status !== 'OK') {
      throw new BadRequestException(
        'Unable to find location for the given address',
      );
    }

    const { lat: latitude, lng: longitude } =
      res.data.results[0].geometry.location;

    // 2️⃣ Define the service cost (can be made dynamic later)
    const serviceCost = 500; // smallest currency unit (e.g., kobo/cent)

    // 3️⃣ Debit caller's wallet
    const callerWallet = await this.walletService.getWalletByUserId(userId);
    if (!callerWallet) {
      throw new ForbiddenException('Wallet not found for this user.');
    }

    const totalAvailable =
      (callerWallet.balance || 0) + (callerWallet.loanBalance || 0);

    if (totalAvailable < serviceCost) {
      throw new ForbiddenException(
        `Insufficient funds. Required: ${serviceCost}, Available: ${totalAvailable}`,
      );
    }
    await this.walletService.debit(
      userId,
      serviceCost,
      'Emergency service request',
    );

    // 4️⃣ Find nearest emergency service provider
    const providers = await this.userModel
      .find({ role: UserRole.EMERGENCY_SERVICES })
      .select('-password')
      .exec();

    let nearestProvider: (User & { distance: number }) | null = null;

    for (const provider of providers) {
      if (
        typeof provider.latitude !== 'number' ||
        typeof provider.longitude !== 'number'
      ) {
        continue;
      }

      const distance = getDistanceFromLatLonInKm(
        latitude,
        longitude,
        provider.latitude,
        provider.longitude,
      );

      if (!nearestProvider || distance < nearestProvider.distance) {
        nearestProvider = { ...provider.toObject(), distance };
      }
    }

    if (!nearestProvider) {
      // Refund if no provider found
      await this.walletService.credit(
        userId,
        serviceCost,
        'Refund - No emergency provider found',
      );
      throw new BadRequestException(
        'No emergency service provider available nearby.',
      );
    }

    // 5️⃣ Credit provider's wallet
    await this.walletService.credit(
      nearestProvider._id,
      serviceCost,
      'Emergency service response',
    );

    const percentageAmount = 50; // Example 10% cut
    const emergencyRecord = new this.emergencyStockModel({
      state: formData.state,
      ward: formData.ward,
      lga: formData.lga,
      natureOfIncident: formData.natureOfIncident,
      address: formData.address,
      services_amount: serviceCost,
      percentage_amount: percentageAmount,
      caller: userId,
      facility: nearestProvider._id,
    });

    await emergencyRecord.save();

    await this.streamService.sendEmergencyAlert(
      nearestProvider._id.toString(),
      { latitude, longitude },
      nearestProvider.distance,
    );

    // 6️⃣ Return info for logging or notifying
    return {
      message: 'Emergency request handled successfully',
      incidentLocation: { latitude, longitude },
      provider: {
        id: nearestProvider._id,
        name: nearestProvider.officerInCharge,
        distance: nearestProvider.distance,
      },
    };
  }
  async getEmergenciesByFacility(facilityId: string) {
    try {
      const emergencies = await this.emergencyStockModel
        .find({
          facility: facilityId,
        })
        .exec();

      return emergencies;
    } catch (error) {
      throw new Error(
        `Failed to fetch emergencies for facility ${facilityId}: ${error.message}`,
      );
    }
  }
}
