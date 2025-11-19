import axios from "axios";

export default async function smsSender(mobileNo: string, message: string, dlt_te_id: string) {
    const dataToSend = {
        authkey: process.env.SMS_KEY,
        mobiles: mobileNo,
        message: message,
        sender: 'BIRANN',
        route: 'default',
        country: '91',
        DLT_TE_ID: dlt_te_id
    }

    const response = await axios.post(`${process.env.SMS_URL}`, null, {
        params: dataToSend,
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });
}