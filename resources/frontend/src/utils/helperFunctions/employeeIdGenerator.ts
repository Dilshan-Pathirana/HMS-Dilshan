let serialNumber = 1; // Initialize the serial number

export const generateEmployeeId = (
    branchSymbol: string,
    joiningYear: number,
    userType: string,
) => {
    const clinicCode = "CURE"; // The fixed prefix
    const doctorIdentifier = userType; // D for Doctor
    const groupLetter = String.fromCharCode(
        65 + Math.floor((serialNumber - 1) / 300),
    ); // A, B, C, ...
    const paddedSerial = String(serialNumber).padStart(4, "0"); // 0001, 0002, ...

    const employeeId = `${clinicCode}${branchSymbol}${doctorIdentifier}${joiningYear.toString().slice(-2)}${groupLetter}${paddedSerial}`;

    serialNumber++; // Increment the serial number for the next call

    return employeeId;
};
