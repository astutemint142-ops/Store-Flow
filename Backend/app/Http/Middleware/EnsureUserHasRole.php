<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     * @param  string  ...$roles  allowed role values, e.g. 'owner', 'counter_staff'
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $userRole = $request->user()?->role?->value;

        if (! in_array($userRole, $roles, true)) {
            abort(403, 'You are not allowed to perform this action.');
        }

        return $next($request);
    }
}
