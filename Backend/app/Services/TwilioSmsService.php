<?php

namespace App\Services;

use Throwable;
use Twilio\Rest\Client;

class TwilioSmsService
{
    private ?Client $client;

    public function __construct()
    {
        $sid = config('services.twilio.sid');
        $token = config('services.twilio.auth_token');

        $this->client = ($sid && $token) ? new Client($sid, $token) : null;
    }

    public function isConfigured(): bool
    {
        return $this->client !== null && config('services.twilio.from_number');
    }

    /**
     * Send an SMS. Returns ['success' => bool, 'error' => ?string].
     *
     * @return array{success: bool, error: ?string}
     */
    public function send(string $toPhone, string $message): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'error' => 'Twilio is not configured yet — add TWILIO_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER to .env.',
            ];
        }

        try {
            $this->client->messages->create($this->toE164($toPhone), [
                'from' => config('services.twilio.from_number'),
                'body' => $message,
            ]);

            return ['success' => true, 'error' => null];
        } catch (Throwable $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Twilio requires phone numbers in international "+countrycode..."
     * format. Customers are usually saved with a local "0..." number, so we
     * convert that here. Already-international numbers are left as-is.
     */
    private function toE164(string $phone): string
    {
        $phone = preg_replace('/[\s\-()]/', '', $phone);

        if (str_starts_with($phone, '+')) {
            return $phone;
        }

        $countryCode = config('services.twilio.default_country_code', '+92');

        if (str_starts_with($phone, '0')) {
            return $countryCode.substr($phone, 1);
        }

        return $countryCode.$phone;
    }
}
