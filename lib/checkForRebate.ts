
export const checkForRebate = (date: Date | string): number => {
    const providedDate = new Date(date);
    const currentDate = new Date();

    const differenceInMs = currentDate.getTime() - providedDate.getTime();

    const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);

    if (differenceInDays > 30) {
        return 0
    } else {
        return Number(process.env.REBATE_PERCENTAGE)
    }
}