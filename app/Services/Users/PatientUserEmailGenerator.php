<?php

namespace App\Services\Users;

class PatientUserEmailGenerator
{
    public static function generate($firstName, $lastName): string
    {
        return $firstName.$lastName.random_int(1, 100).'@hms.com';
    }
}
