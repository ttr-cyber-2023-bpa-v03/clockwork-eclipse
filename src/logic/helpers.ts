import { promises as fs } from "fs";
import path from "path";

export async function traverseDirectory(baseDir: string): Promise<string[]> {
    const stack = [ baseDir ];
    const result: string[] = [];

    do {
        const currentDir = stack.pop()!;
        const dirents = await fs.readdir(currentDir, { withFileTypes: true });

        for (const dirent of dirents) {
            const filePath = path.join(currentDir, dirent.name);
            const relativePath = path.relative(baseDir, filePath);

            if (dirent.isDirectory())
                stack.push(filePath);
            else
                result.push(relativePath);
        }
    } while (stack.length > 0);

    return result;
}

export async function findFiles(baseDir: string, pattern: RegExp): Promise<string[]> {
    const files = await traverseDirectory(baseDir);
    return files.filter(file => pattern.test(file));
}

export function fixSlash(path: string): string {
    // For Windows platforms because Microsoft has to be so extra about everything
    return path.replace(/\\/g, "/");
}

export function validatePort(port: number): boolean {
    return port > 0 && port < 65536;
}