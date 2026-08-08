<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Mail\VerificationCodeMail;
use App\Mail\WelcomeMail;
use App\Models\PendingRegistration;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RegistrationController extends Controller
{
    private const CODE_EXPIRY_MINUTES = 15;

    private const MAX_ATTEMPTS = 5;

    /**
     * Step 1 of registration: validate the business/owner details, email a
     * 6-digit verification code, and stash everything as a pending
     * registration until the code is confirmed. No Tenant/User is created
     * yet — that only happens once verify() succeeds.
     */
    public function start(Request $request)
    {
        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'owner_phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Clear out any earlier unfinished attempt for this email so they
        // can always restart cleanly.
        PendingRegistration::where('owner_email', $data['owner_email'])->delete();

        $code = (string) random_int(100000, 999999);

        $pending = PendingRegistration::create([
            'token' => Str::random(40),
            'business_name' => $data['business_name'],
            'owner_name' => $data['owner_name'],
            'owner_email' => $data['owner_email'],
            'owner_phone' => $data['owner_phone'] ?? null,
            'password' => $data['password'],
            'verification_code' => $code,
            'expires_at' => now()->addMinutes(self::CODE_EXPIRY_MINUTES),
        ]);

        Mail::to($pending->owner_email)->send(new VerificationCodeMail($pending->business_name, $code));

        return response()->json([
            'registration_token' => $pending->token,
        ], 201);
    }

    /**
     * Step 2: confirm the code and actually create the Tenant + Owner user,
     * then log them straight in (same response shape the old one-step
     * register() used to return).
     */
    public function verify(Request $request)
    {
        $data = $request->validate([
            'registration_token' => ['required', 'string'],
            'code' => ['required', 'string'],
        ]);

        $pending = PendingRegistration::where('token', $data['registration_token'])->first();

        if (! $pending) {
            abort(404, 'This registration could not be found. Please start again.');
        }

        if ($pending->isExpired()) {
            $pending->delete();
            abort(410, 'This verification code has expired. Please register again.');
        }

        if ($pending->verification_code !== $data['code']) {
            $pending->increment('attempts');

            if ($pending->attempts >= self::MAX_ATTEMPTS) {
                $pending->delete();
                abort(429, 'Too many incorrect attempts. Please register again.');
            }

            throw ValidationException::withMessages([
                'code' => ['That code is incorrect. Please check your email and try again.'],
            ]);
        }

        $user = DB::transaction(function () use ($pending) {
            $tenant = Tenant::create([
                'business_name' => $pending->business_name,
                'owner_name' => $pending->owner_name,
                'owner_email' => $pending->owner_email,
                'owner_phone' => $pending->owner_phone,
            ]);

            $user = User::create([
                'tenant_id' => $tenant->id,
                'name' => $pending->owner_name,
                'email' => $pending->owner_email,
                'password' => $pending->password,
                'role' => UserRole::Owner,
            ]);

            $pending->delete();

            return $user;
        });

        Mail::to($user->email)->send(new WelcomeMail($user->tenant->business_name, $user->name));

        $token = $user->createToken($request->userAgent() ?? 'api-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
                'profile_photo_url' => $user->profile_photo_url,
            ],
            'token' => $token,
        ], 201);
    }

    /**
     * Resend a fresh code for an in-progress registration (e.g. the email
     * never arrived or the previous code expired).
     */
    public function resend(Request $request)
    {
        $data = $request->validate([
            'registration_token' => ['required', 'string'],
        ]);

        $pending = PendingRegistration::where('token', $data['registration_token'])->first();

        if (! $pending) {
            abort(404, 'This registration could not be found. Please start again.');
        }

        $code = (string) random_int(100000, 999999);

        $pending->update([
            'verification_code' => $code,
            'attempts' => 0,
            'expires_at' => now()->addMinutes(self::CODE_EXPIRY_MINUTES),
        ]);

        Mail::to($pending->owner_email)->send(new VerificationCodeMail($pending->business_name, $code));

        return response()->noContent();
    }
}
