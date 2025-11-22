export async function raceAll<T extends any>(values: Promise<T>[]): Promise<T[]> {
    const result: T[] = [];
    const tracked = values.map(p => p.then(v => result.push(v)));
    await Promise.race(tracked);
    return result;
}

export async function fulfilled(promise: Promise<any>): Promise<boolean> {
    let fulfilled = false;
    promise.then(_ => fulfilled = true);
    await Promise.resolve();
    return fulfilled;
}

