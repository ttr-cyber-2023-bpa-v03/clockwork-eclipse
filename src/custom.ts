import "reflect-metadata";
import "dotenv/config";

import { Security } from "./utils/security";

const [ hmacSalt, hash ] = await Security.hashPasswd("test password");
console.log("Password hash:", hash);
console.log("HMAC salt:", hmacSalt);