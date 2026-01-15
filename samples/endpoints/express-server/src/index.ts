import { trace } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { NodeSDK } from "@opentelemetry/sdk-node";
import cors from "cors";
import * as dotenv from "dotenv";
import express, { type Request, type Response } from "express";
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
            // "@opentelemetry/instrumentation-http": {
            //     enabled: false
            // },
            "@opentelemetry/instrumentation-fs": {
                enabled: false
            }
        }),
        new ExpressInstrumentation()
    ]
});

sdk.start();

const tracer = trace.getTracer("express-server");

const app = express();
const port = 1234;

app.use(cors());

app.get("/api/user-info/getInfo", (req: Request, res: Response) => {
    try {
        tracer.startActiveSpan("get-user-info", span => {
            // HACK: Somehow sometimes a delay is required otherwise the endpoints returns a 404.
            setTimeout(() => {
                res.json({
                    email: "ava.morgan92@example.com",
                    createdAt: "2024-08-19T10:42:15Z",
                    status: "active"
                });

                span.end();
            }, 5);
        });
    } catch (error: unknown) {
        console.error("[server] Failed to start an active OpenTelemetry span:", error);
    }
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
