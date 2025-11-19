function formatToDateOnly(isoString: string) {
    if (!isoString) return null;

    try {
        const date = new Date(isoString);
        return date.toISOString().slice(0, 10);
    } catch (error) {
        console.error("Invalid date:", isoString);
        return null;
    }
}

export default formatToDateOnly