import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService
      .get<string>('FIREBASE_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase Admin credentials missing — push notifications disabled');
      return;
    }

    if (!getApps().length) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    }
    this.initialized = true;
  }

  async sendToDevice(
    fcmToken: string,
    title: string,
    body: string,
    data: Record<string, string> = {},
  ): Promise<void> {
    if (!this.initialized) {
      this.logger.warn('Push skipped — Firebase Admin not initialised');
      return;
    }
    try {
      await getMessaging().send({
        token: fcmToken,
        notification: { title, body },
        data,
        android: { priority: 'high' },
      });
    } catch (err) {
      this.logger.error('FCM send failed:', err);
    }
  }
}
