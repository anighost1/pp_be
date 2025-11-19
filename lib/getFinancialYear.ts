function getFinancialYear(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // January = 0

    if (month >= 4) {
        // April to December → current year - next year
        return `${year}-${year + 1}`;
    } else {
        // January to March → previous year - current year
        return `${year - 1}-${year}`;
    }
}

export default getFinancialYear;