import * as bcrypt from 'bcryptjs';

export class HashUtil {
  static async hash(data: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(data, salt);
  }

  static async compare(data: string, hash: string): Promise<boolean> {
    return bcrypt.compare(data, hash);
  }
}
