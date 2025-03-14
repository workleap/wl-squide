import { test } from "vitest";
import { findSupportedPreferredLanguage } from "../src/i18nextPlugin.ts";

test.concurrent("when no preferred language match the supported languages, return undefined", ({ expect }) => {
    const result = findSupportedPreferredLanguage(["fr-CA", "fr"], ["en-US", "en"]);

    expect(result).toBeUndefined();
});

test.concurrent("when a preferred language exactly match a supported language, return the matching language", ({ expect }) => {
    const result = findSupportedPreferredLanguage(["fr-CA", "fr"], ["en-US", "en", "fr-CA", "fr"]);

    expect(result).toBe("fr-CA");
});

test.concurrent("when no preferred language exactly match the supported languages but a preferred language partially match a supported language, return the partially matching language", ({ expect }) => {
    const result = findSupportedPreferredLanguage(["fr"], ["en-US", "en", "fr-CA"]);

    expect(result).toBe("fr-CA");
});

test.concurrent("when no preferred language exactly match the supported languages but a supported language partially match a preferred language, return the partially matching language", ({ expect }) => {
    const result = findSupportedPreferredLanguage(["fr-CA"], ["en-US", "en", "fr"]);

    expect(result).toBe("fr");
});

test.concurrent("when multiple preferred languages exactly match supported languages, return the left most exactly matching preferred language", ({ expect }) => {
    const result = findSupportedPreferredLanguage(["fr-CA", "en-US", "fr"], ["en-US", "en", "fr-CA"]);

    expect(result).toBe("fr-CA");
});

test.concurrent("when multiple preferred languages partially match supported languages, return the left most partially matching preferred language", ({ expect }) => {
    const result = findSupportedPreferredLanguage(["fr", "en"], ["en", "fr"]);

    expect(result).toBe("fr");
});

test.concurrent("when multiple preferred languages partially match supported languages but a single preferred language exactly match a supported language, return the exactly matching preferred language", ({ expect }) => {
    const result = findSupportedPreferredLanguage(["fr", "en-US", "en"], ["en-US", "fr-CA"]);

    expect(result).toBe("en-US");
});
