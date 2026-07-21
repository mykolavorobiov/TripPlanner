import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthCredentialsDto {
  @ApiProperty({ example: 'traveller@example.com', format: 'email' })
  email!: string;

  @ApiProperty({ example: 'strong-password', minLength: 6 })
  password!: string;
}

export class OAuthSessionDto {
  @ApiProperty({ description: 'Supabase access token returned by OAuth.' })
  accessToken!: string;

  @ApiProperty({ description: 'Supabase refresh token returned by OAuth.' })
  refreshToken!: string;

  @ApiPropertyOptional({ description: 'Access token expiry as Unix time.' })
  expiresAt?: number;
}
