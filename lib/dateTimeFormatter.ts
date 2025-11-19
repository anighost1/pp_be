
export default function DateTimeFormatter(date: Date): string {
    const pad = (n: number): string => n.toString().padStart(2, "0");

    return (
        date.getFullYear() + "-" +
        pad(date.getMonth() + 1) + "-" +
        pad(date.getDate()) + " " +
        pad(date.getHours()) + ":" +
        pad(date.getMinutes()) + ":" +
        pad(date.getSeconds())
    );
}

export function DateTimeFormatterIST(date: Date): string {
    return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
}