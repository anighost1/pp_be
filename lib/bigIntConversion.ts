// function convertBigIntToString(obj: any): any {
//     if (Array.isArray(obj)) {
//         return obj.map(convertBigIntToString);
//     } else if (obj && typeof obj === 'object') {
//         const result: any = {};
//         for (const key in obj) {
//             const value = obj[key];
//             result[key] = typeof value === 'bigint' ? value.toString() : convertBigIntToString(value);
//         }
//         return result;
//     }
//     return obj;
// }

// export default convertBigIntToString
function convertBigIntToString(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    } else if (obj && typeof obj === 'object') {
        if (obj instanceof Date) return obj; // 🛑 Do not recurse into Date objects

        const result: any = {};
        for (const key in obj) {
            const value = obj[key];
            result[key] = typeof value === 'bigint'
                ? value.toString()
                : convertBigIntToString(value);
        }
        return result;
    }
    return obj;
}

export default convertBigIntToString