export const sendSMS = async (phone: string, message: string) => {
    const params = new URLSearchParams({
        username: 'cure_health',
        password: 'hq6k2@Qpc42',
        src: 'CURE HEALTH',
        dst: phone,
        msg: message,
        dr: '1'
    });

    try {
        await fetch(`https://sms.textware.lk:5001/sms/send_sms.php?${params}`, {
            method: "POST",
            mode: "no-cors",
        });
        return true;
    } catch (error) {
        console.error('SMS sending failed:', error);
        return false;
    }
};
