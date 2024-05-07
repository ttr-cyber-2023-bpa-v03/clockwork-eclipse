export type JSONArray = JSONValue[];
export type JSONObject = { [key: string]: JSONValue };
export type JSONValue = string | number | boolean | null | JSONArray[] | JSONObject;

// Function to convert an object to a URL query string
export function objToURLQuery(obj: object): string {
    const params: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
        const encKey = encodeURIComponent(key);
        const encValue = encodeURIComponent(typeof value === "object" ?
            JSON.stringify(value) : String(value));
        params.push(`${encKey}=${encValue}`);
    }

    return params.join("&");
}

export function toIsoWithOffset(date: Date) {
    const tzo = -date.getTimezoneOffset();

    const dif = tzo >= 0 ? "+" : "-";
    const pad = (n: number) => (n < 10 ? "0" : "") + n;
  
    return date.getFullYear() +
        "-" + pad(date.getMonth() + 1) +
        "-" + pad(date.getDate()) +
        "T" + pad(date.getHours()) +
        ":" + pad(date.getMinutes()) +
        ":" + pad(date.getSeconds()) +
        dif + pad(Math.floor(Math.abs(tzo) / 60)) +
        ":" + pad(Math.abs(tzo) % 60);
}