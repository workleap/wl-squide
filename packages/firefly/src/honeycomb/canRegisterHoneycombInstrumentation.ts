export function canRegisterHoneycombInstrumentation() {
    // The second one is due to an error. Will be able to remove soon.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return globalThis.__WLP_HONEYCOMB_INSTRUMENTATION_IS_REGISTERED__ === true || globalThis.__WLP_HONEYCOMB_INSTRUMENTATION_IS_REGISTERED === true;
}
