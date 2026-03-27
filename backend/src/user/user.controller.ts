import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'List all active users' })
  async getUsers() {
    return this.userService.getUsers();
  }

  @Get('coordinators')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'List all coordinators' })
  async getCoordinators() {
    return this.userService.getCoordinators();
  }

  @Get('coordinators/:role')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'List coordinators by role' })
  async getCoordinatorsByRole(@Param('role') role: string) {
    return this.userService.getCoordinatorsByRole(role);
  }

  @Get(':id')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Put(':id/role')
  @UseGuards(AuthGuard('azure-ad'))
  @ApiOperation({ summary: 'Update user role' })
  async updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.userService.updateUserRole(id, role);
  }
}
