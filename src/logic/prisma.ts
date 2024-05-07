import { PrismaClient } from "@prisma/client";
export * from "@prisma/client";

const database = new PrismaClient();
export default database;