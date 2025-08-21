/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// src/stream/stream.service.ts
import { Injectable } from '@nestjs/common';
import { StreamChat } from 'stream-chat';

@Injectable()
export class StreamService {
  private serverClient: StreamChat;

  constructor() {
    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Stream API credentials are missing');
    }

    this.serverClient = StreamChat.getInstance(apiKey, apiSecret);
  }

  createUserToken(userId: string) {
    return this.serverClient.createToken(userId);
  }

  async sendEmergencyAlert(
    providerId: string,
    incidentLocation: { latitude: number; longitude: number },
    distance: number,
  ) {
    await this.serverClient.upsertUser({ id: providerId });
    await this.serverClient.sendUserCustomEvent(providerId, {
      type: 'emergency_request',
      data: {
        incidentLocation,
        distance,
      },
    } as any);
  }
}
