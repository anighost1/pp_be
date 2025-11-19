function numberToWords(amount: number): string {
    const words: Record<number, string> = {
        0: '', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
        6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
        11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen',
        15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen',
        19: 'nineteen', 20: 'twenty', 30: 'thirty', 40: 'forty',
        50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety'
    };

    const digits = ['', 'hundred', 'thousand', 'lakh', 'crore'];

    let no = Math.floor(amount);
    let point = Math.round((amount - no) * 100);
    const str: (string | null)[] = [];
    let i = 0;

    while (no > 0) {
        const divider = i === 2 ? 10 : 100;
        const num = no % divider;
        no = Math.floor(no / divider);
        i += divider === 10 ? 1 : 2;

        if (num) {
            const counter = str.length;
            const plural = (counter && num > 9) ? 's' : '';
            const hundred = (counter === 1 && str[0]) ? ' and ' : '';

            if (num < 21) {
                str.push(`${words[num]} ${digits[counter]}${plural} ${hundred}`);
            } else {
                const tens = Math.floor(num / 10) * 10;
                const unit = num % 10;
                str.push(`${words[tens]} ${words[unit]} ${digits[counter]}${plural} ${hundred}`);
            }
        } else {
            str.push(null);
        }
    }

    const result = str.reverse().filter(Boolean).join('').trim();

    let points = '';
    if (point > 0) {
        const tens = Math.floor(point / 10) * 10;
        const unit = point % 10;
        points = ` and ${words[tens]} ${words[unit]} Paise`;
    }

    const final = `${result ? result + ' Rupees' : ''}${points} Only`;

    return final.replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
}

export default numberToWords;