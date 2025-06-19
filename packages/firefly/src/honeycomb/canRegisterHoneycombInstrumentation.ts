export function canRegisterHoneycombInstrumentation() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return globalThis.__WLP_HONEYCOMB_INSTRUMENTATION_IS_REGISTERED__ === true;
}
