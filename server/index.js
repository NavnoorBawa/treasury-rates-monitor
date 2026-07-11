import compression from "compression";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CACHE_TTL_MS, HISTORY_CACHE_TTL_MS, PORT } from "./config.js";
import { MemoryCache } from "./cache.js";
import { getHistoricalYieldData } from "./historicalClient.js";
import { getTreasuryYieldData } from "./treasuryClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const cache = new MemoryCache();
const historyCache = new MemoryCache();

app.disable("x-powered-by");
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    },
    frameguard: {
      action: "deny"
    },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    }
  })
);

app.use((_request, response, next) => {
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  next();
});

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "treasury-yield-dashboard" });
});

app.get("/api/yields", async (_request, response) => {
  const cached = cache.get();

  if (cached?.isFresh) {
    response.setHeader("Cache-Control", "public, max-age=60");
    return response.json({
      ...cached.value,
      cache: { status: "hit", ttlSeconds: Math.round(CACHE_TTL_MS / 1000) }
    });
  }

  try {
    const data = await getTreasuryYieldData();
    cache.set(data, CACHE_TTL_MS);
    response.setHeader("Cache-Control", "public, max-age=60");
    return response.json({
      ...data,
      cache: { status: "refresh", ttlSeconds: Math.round(CACHE_TTL_MS / 1000) }
    });
  } catch (error) {
    if (cached?.value) {
      return response.status(200).json({
        ...cached.value,
        cache: {
          status: "stale",
          ttlSeconds: Math.round(CACHE_TTL_MS / 1000),
          warning: "Using stale cached data because the Treasury feed could not be reached."
        }
      });
    }

    return response.status(503).json({
      error: "Treasury data unavailable",
      message: error instanceof Error ? error.message : "Unknown feed error"
    });
  }
});

app.get("/api/history", async (_request, response) => {
  const cached = historyCache.get();

  if (cached?.isFresh) {
    response.setHeader("Cache-Control", "public, max-age=300");
    return response.json({
      ...cached.value,
      cache: { status: "hit", ttlSeconds: Math.round(HISTORY_CACHE_TTL_MS / 1000) }
    });
  }

  try {
    const data = await getHistoricalYieldData();
    historyCache.set(data, HISTORY_CACHE_TTL_MS);
    response.setHeader("Cache-Control", "public, max-age=300");
    return response.json({
      ...data,
      cache: { status: "refresh", ttlSeconds: Math.round(HISTORY_CACHE_TTL_MS / 1000) }
    });
  } catch (error) {
    if (cached?.value) {
      return response.status(200).json({
        ...cached.value,
        cache: {
          status: "stale",
          ttlSeconds: Math.round(HISTORY_CACHE_TTL_MS / 1000),
          warning: "Using stale cached data because the Federal Reserve H.15 download could not be reached."
        }
      });
    }

    return response.status(503).json({
      error: "Historical Treasury data unavailable",
      message: error instanceof Error ? error.message : "Unknown historical feed error"
    });
  }
});

const distPath = path.resolve(__dirname, "..", "dist");
app.use("/assets", express.static(path.join(distPath, "assets"), { immutable: true, maxAge: "1y" }));
app.use(express.static(distPath));

app.use((_request, response) => {
  response.status(404).sendFile(path.join(distPath, "404.html"));
});

const server = app.listen(PORT);

server.on("listening", () => {
  console.log(`Treasury Yield Dashboard listening on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  console.error(`Treasury Yield Dashboard could not bind to port ${PORT}: ${error.message}`);
  process.exitCode = 1;
});
