import c from "ansi-colors";

const console_debug = console.debug;
console.debug = (...msg: any[]) => console_debug(c.cyan("DEBUG"), "|", ...msg);

const console_log = console.log;
console.log = (...msg: any[]) => console_log(c.green("LOG"), "  |", ...msg);

const console_info = console.info;
console.info = (...msg: any[]) => console_info(c.blue("INFO"), " |", ...msg);

const console_warn = console.warn;
console.warn = (...msg: any[]) => console_warn(c.yellow("WARN"), " |", ...msg);

const console_error = console.error;
console.error = (...msg: any[]) => console_error(c.red("ERROR"), "|", ...msg);

(console as any).success = (...msg: any[]) => console_log(c.green("SUCCESS"), "|", ...msg);