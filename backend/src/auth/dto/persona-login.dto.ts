import { IsNotEmpty, IsEnum } from 'class-validator';

export enum PersonaType {
  CUSTOMER_RAHUL = 'CUSTOMER_RAHUL',
  CUSTOMER_PRIYA = 'CUSTOMER_PRIYA',
  SELLER_RAMESH = 'SELLER_RAMESH',
  DELIVERY_SURESH = 'DELIVERY_SURESH',
}

export class PersonaLoginDto {
  @IsNotEmpty()
  @IsEnum(PersonaType)
  persona: PersonaType;
}
