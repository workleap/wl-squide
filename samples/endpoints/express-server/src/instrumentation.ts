import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import * as dotenv from "dotenv";
import path from "node:path";

dotenv.config({
    path: [path.resolve("../../../.env.local")]
});

const sdk = new NodeSDK({
    serviceName: "squide-endpoints-sample",
    traceExporter: new OTLPTraceExporter({
        url: "https://api.honeycomb.io/v1/traces",
        headers: {
            "x-honeycomb-team": process.env.HONEYCOMB_API_KEY ?? ""
        }
    }),
    instrumentations: [
        ...getNodeAutoInstrumentations({
            "@opentelemetry/instrumentation-express": {
                enabled: false
            },
            // "@opentelemetry/instrumentation-http": {
            //     enabled: false
            // },
            "@opentelemetry/instrumentation-fs": {
                enabled: false
            }
        })
    ]
});

sdk.start();
