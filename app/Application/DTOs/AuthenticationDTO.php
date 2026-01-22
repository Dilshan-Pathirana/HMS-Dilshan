<?php

namespace App\Application\DTOs;

/**
 * User authentication DTO
 */
class AuthenticationDTO extends BaseDTO
{
    public string $email;
    public string $password;
    public ?string $mfaCode = null;

    public function __construct(string $email, string $password, ?string $mfaCode = null)
    {
        $this->email = $email;
        $this->password = $password;
        $this->mfaCode = $mfaCode;
    }
}
