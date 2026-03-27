import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMailboxDto {
  @ApiProperty({ example: 'logistics@company.com' })
  @IsEmail()
  emailAddress: string;

  @ApiProperty({ example: 'Logistics Mailbox', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;
}