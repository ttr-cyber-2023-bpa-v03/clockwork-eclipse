import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";

export class Security {
    // Create an HMAC with a password-pepper combination and use a salt to primarily
    // prevent chances of a collision.
    public static hmacPasswd(password: string, salt: string | Buffer): string {
        const pepper = Buffer.from(process.env.PASSWORD_PEPPER!, "base64");
        return crypto.createHmac("sha256", pepper)
            .update(salt + password)
            .digest().toString("base64");
    }

    // Hash the password with the HMAC salt and return the salt and hash
    public static async hashPasswd(password: string): Promise<[string, string]> {
        const hmacSalt = crypto.randomBytes(24);
        const hash = await bcrypt.hash(this.hmacPasswd(password, hmacSalt), 10);
        return [ hmacSalt.toString("base64"), hash ];
    }

    // Verify the password with the hash and the HMAC salt encoded in base64
    public static async verifyPasswd(
        password: string,
        hash: string,
        encodedSalt: string
    ): Promise<boolean> {
        const hmacSalt = Buffer.from(encodedSalt, "base64");
        return await bcrypt.compare(this.hmacPasswd(password, hmacSalt), hash);
    }

    public static createToken<T>(payload: T, options?: SignOptions): string {
        const secret = Buffer.from(process.env.JWT_SECRET!, "base64");
        return jwt.sign(payload as object, secret, options);
    }

    public static decodeToken<T>(token: string): any {
        const secret = Buffer.from(process.env.JWT_SECRET!, "base64");
        return jwt.verify(token, secret) as T;
    }
}