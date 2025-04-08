import { Allow, IsEnum, IsNotEmpty } from 'class-validator';


export enum WalletType {
    Personal = 'personal',
    Business = 'business',
  }

  export enum Currency {
    NGN = 'NGN',
    USD = 'USD',
    GBP = 'GBP',
    EUR = 'EUR',
    AED = 'AED',
    JPY = 'JPY'
  }
  export class CreateWalletDto {
    @IsNotEmpty()
    userId: string;
  
    @IsEnum(Currency)
    currency: Currency;
  
    @IsEnum(WalletType)
    walletType: WalletType;;
  
  }