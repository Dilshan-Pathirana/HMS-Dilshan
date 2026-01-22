<?php

namespace App\Services;

class EmployeeIdGenerator
{
    private static string $companyInitials = 'CURE';

    private static array $rollsLetterMapper = [
        5 => 'D',
        4 => 'N',
        1 => 'A',
        3 => 'C',
        6 => 'P',
        7 => 'V',
    ];

    public static function generate(string $userRole, ?string $divisionNumber = ''): string
    {
        $randomLetter = self::getRandomLetter();
        $random4DigitNumber = self::getRandomFourDigitNumber();
        $division = $divisionNumber ?? '';
        $roleCode = self::$rollsLetterMapper[$userRole] ?? 'S';

        return self::$companyInitials.$division.$roleCode.date('y').$randomLetter.$random4DigitNumber;
    }

    public static function getRandomLetter(): string
    {
        return chr(rand(65, 90));
    }

    private static function getRandomFourDigitNumber(): string
    {
        return str_pad((string) rand(0, 9999), 4, '0', STR_PAD_LEFT);
    }
}
