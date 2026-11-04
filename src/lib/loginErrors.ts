/** The error a throttled password sign-in throws. NextAuth hands the message
 *  to the client as `error`, so the form can say "too many attempts" instead
 *  of "invalid password". Its own module so the sign-in form can import it
 *  without pulling the Redis client into the browser bundle. */
export const LOGIN_THROTTLED = "TooManyAttempts";
