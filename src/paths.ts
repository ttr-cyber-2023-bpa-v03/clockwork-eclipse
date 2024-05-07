import path from "path";

export const sourceDir = path.resolve(import.meta.dirname);
export const rootDir = path.resolve(sourceDir, "../");
export const assetsDir = path.resolve(rootDir, "assets");
export const certsDir = path.resolve(rootDir, "certs");
export const privateDir = path.resolve(rootDir, "private");

export default Object.freeze({
    sourceDir,
    rootDir,
    assetsDir,
    certsDir,
    privateDir
});