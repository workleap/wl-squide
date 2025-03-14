import "@testing-library/jest-dom";

import { TextDecoder, TextEncoder } from "node:util";

// https://github.com/mswjs/msw/issues/1796
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
