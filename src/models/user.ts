import { Security } from "@utils/security";

import prisma, { User as IUser, UserStats as IUserStats, Prisma } from "@logic/prisma";
export type { IUser, IUserStats };

// First entry in enum is zero, so applying '!' check will determine if it's valid

export enum UsernameValidity {
    VALID,
    OUT_OF_BOUNDS = "Username must be 3-16 characters long",
    BAD_FORMAT = "Username must contain alphanumeric characters or underscores only",
    BAD_UNDERSCORE = "Username must not end with or contain more than one underscore"
}

export enum PasswordValidity {
    VALID,
    OUT_OF_BOUNDS = "Password must be 14 or more characters long",
    BAD_CASING = "Password must contain at least one uppercase and lowercase letter",
    NO_NUMBER = "Password must contain at least one number",
    NO_SPECIAL = "Password must contain at least one special character"
}

export enum UserValidity {
    SUCCESS,
    INVALID_EMAIL = "Email is not valid",
    USERNAME_TAKEN = "Username is already taken",
    EMAIL_TAKEN = "Email is already in use",
    DATABASE_ERROR = "Failed to contact database"
}

export enum LoginStatus {
    SUCCESS,
    INVALID_CREDENTIALS = "Invalid email or password"
}

export interface CreateUserOptions {
    username: string;
    email: string;
    password: string;
}

export interface UserAuth {
    id: string;
    user: true;
}

// CRUD operations for the database
export enum DatabaseOperation {
    CREATE = "CREATE",
    READ = "READ",
    UPDATE = "UPDATE",
    DELETE = "DELETE"
}

export class UserAuthError extends Error {
    public readonly status: LoginStatus;

    constructor(status: LoginStatus) {
        super("Invalid credentials");
        this.status = status;
    }
}

export class DatabaseError extends Error {
    public readonly operation: DatabaseOperation;
    public readonly prismaError: Prisma.PrismaClientKnownRequestError;

    constructor(operation: DatabaseOperation, prismaError: Prisma.PrismaClientKnownRequestError) {
        super("Failed to contact database");
        this.operation = operation;
        this.prismaError = prismaError;
    }
}

export class User {
    private static checkUsername(username: string): UsernameValidity {
        const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9_]+$/;
        const UNDERSCORE_CHECK = /_[^_]*_|_$/;

        if (username.length < 3 || username.length > 16)
            return UsernameValidity.OUT_OF_BOUNDS;
        
        if (!ALPHANUMERIC_REGEX.test(username))
            return UsernameValidity.BAD_FORMAT;

        if (UNDERSCORE_CHECK.test(username))
            return UsernameValidity.BAD_UNDERSCORE;

        return UsernameValidity.VALID;
    }

    // This is a simple email regex that i yoinked off stack overflow.
    // I have no clue how this works and I don't want to know (regex is a nightmare)
    private static checkEmail(email: string): boolean {
        const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return EMAIL_REGEX.test(email);
    }

    // A secure password is 14 or more characters long, contains at least one
    // uppercase letter, one lowercase letter, one number, and one special character.
    // This comes from CIS specifications. As a programmer, I'm doing the users a favor.
    // They can cope if they can't use "password123" as their password.
    private static checkPassword(password: string): PasswordValidity {
        const UPPERCASE_REGEX = /[A-Z]/;
        const LOWERCASE_REGEX = /[a-z]/;
        const NUMBER_REGEX = /[0-9]/;
        const SPECIAL_REGEX = /[^A-Za-z0-9]/;

        // Limit the password length to 64 characters in order to avoid a hashing DoS
        if (password.length < 14 || password.length > 64)
            return PasswordValidity.OUT_OF_BOUNDS;

        // Check for the presence of uppercase and lowercase letters
        if (!UPPERCASE_REGEX.test(password) || !LOWERCASE_REGEX.test(password))
            return PasswordValidity.BAD_CASING;
        
        // Check for the presence of a number and a special character
        if (!NUMBER_REGEX.test(password))
            return PasswordValidity.NO_NUMBER;

        // Check for the presence of a special character
        if (!SPECIAL_REGEX.test(password))
            return PasswordValidity.NO_SPECIAL;

        return PasswordValidity.VALID;
    }

    private static async validate(
        { username, email, password }: CreateUserOptions
    ): Promise<UserValidity | UsernameValidity | PasswordValidity> {
        // Validate the username
        const usernameStatus = User.checkUsername(username);
        if (usernameStatus)
            return usernameStatus;

        // Validate the email
        if (!User.checkEmail(email))
            return UserValidity.INVALID_EMAIL;

        // Validate the password
        const passwordStatus = User.checkPassword(password);
        if (passwordStatus)
            return passwordStatus;

        // Check if the username or email is already in use
        const foundUser = await prisma.user.findFirst({ 
            where: { OR: [ {username}, {email} ] },
            select: { username: true, email: true }
        });

        // If the user is found, return an error message
        if (foundUser?.username === username)
            return UserValidity.USERNAME_TAKEN;
        if (foundUser?.email === email)
            return UserValidity.EMAIL_TAKEN;

        return UserValidity.SUCCESS;
    }

    public static async create(
        { username, email, password }: CreateUserOptions
    ): Promise<IUser> {
        // Validate the user to ensure that they fit the set constraints
        const userValidity = await User.validate({ username, email, password });
        if (userValidity)
            throw new Error(userValidity);

        // Apply a strong hash to the password
        let salt: string;
        [ salt, password ] = await Security.hashPasswd(password);

        // Push the new user to the database
        try {
            const stats = await prisma.userStats.create({ data: {} });
            const user = await prisma.user.create({
                data: { username, email, salt, password, statsId: stats.id }
            });

            return user;
        }
        catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError)
                throw new DatabaseError(DatabaseOperation.CREATE, e);
            throw e;
        }
    }

    public static async authenticate(email: string, givenPassword: string): Promise<string> {
        const { id, salt, password } = (await prisma.user.findUnique({ where: { email } }))!;

        const success = await Security.verifyPasswd(givenPassword, password, salt);
        if (!success)
            throw new Error("Invalid password");
        
        return Security.createToken<UserAuth>({ id, user: true }, { expiresIn: "1d" });
    }
}