async function handleAsync<T>(
    promise: Promise<T>,
): Promise<[Error | null, T | null]> {
    try {
        const result = await promise;
        return [null, result];
    } catch (error) {
        return [error as Error, null];
    }
}

export default handleAsync;
