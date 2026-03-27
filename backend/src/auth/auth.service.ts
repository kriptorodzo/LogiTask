import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

// Define roles as constants
export const ROLES = {
  MANAGER: 'MANAGER',
  RECEPTION_COORDINATOR: 'RECEPTION_COORDINATOR',
  DELIVERY_COORDINATOR: 'DELIVERY_COORDINATOR',
  DISTRIBUTION_COORDINATOR: 'DISTRIBUTION_COORDINATOR',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export interface AzureAdUser {
  id: string;
  displayName: string;
  emails: { value: string }[];
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async validateUser(profile: AzureAdUser): Promise<any> {
    // Find or create user based on Azure AD profile
    const email = profile.emails?.[0]?.value || profile.id;
    
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user on first login - default to Reception Coordinator
      // Manager can later update role via admin interface
      user = await this.prisma.user.create({
        data: {
          email,
          displayName: profile.displayName || email,
          role: ROLES.RECEPTION_COORDINATOR,
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    };
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}