export function isUnauthorizedError(error) {
    return (
        error instanceof Error &&
        'status' in error &&
        error.status === 401
    );
}
