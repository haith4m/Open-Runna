export interface JwtPayload {
  sub: string; // user ID
  email: string;
  iat?: number;
  exp?: number;
}
