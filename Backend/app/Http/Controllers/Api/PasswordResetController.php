<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetCodeMail;
use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class PasswordResetController extends Controller
{
    private const CODE_EXPIRY_MINUTES = 15;

    private const MAX_ATTEMPTS = 5;

    /**
     * Send a 6-digit reset code to the given email, if an account exists
     * for it. Always returns the same generic response either way, so this
     * endpoint can't be used to check whether an email is registered.
     */
    public function forgotPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if ($user) {
            $code = (string) random_int(100000, 999999);

            PasswordResetCode::updateOrCreate(
                ['email' => $user->email],
                [
                    'code' => $code,
                    'attempts' => 0,
                    'expires_at' => now()->addMinutes(self::CODE_EXPIRY_MINUTES),
                ]
            );

            try {
                Mail::to($user->email)->send(new PasswordResetCodeMail($user->name, $code));
            } catch (Throwable $e) {
                report($e);
            }
        }

        return response()->json([
            'message' => 'If an account exists with that email, a reset code has been sent.',
        ]);
    }

    /**
     * Confirm the code and set a new password.
     */
    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $reset = PasswordResetCode::where('email', $data['email'])->first();

        if (! $reset) {
            abort(404, 'No password reset was requested for this email. Please start again.');
        }

        if ($reset->isExpired()) {
            $reset->delete();
            abort(410, 'This code has expired. Please request a new one.');
        }

        if ($reset->code !== $data['code']) {
            $reset->increment('attempts');

            if ($reset->attempts >= self::MAX_ATTEMPTS) {
                $reset->delete();
                abort(429, 'Too many incorrect attempts. Please request a new code.');
            }

            throw ValidationException::withMessages([
                'code' => ['That code is incorrect. Please check your email and try again.'],
            ]);
        }

        $user = User::where('email', $data['email'])->first();

        if (! $user) {
            $reset->delete();
            abort(404, 'This account no longer exists.');
        }

        $user->update(['password' => $data['password']]);
        $reset->delete();

        return response()->json([
            'message' => 'Password reset successfully. Please log in with your new password.',
        ]);
    }
}
