import time
import logging
from fastapi import FastAPI, Request, Response
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

logger = logging.getLogger("nextfolio.monitoring")

# --- Prometheus Metrics ---

REQUEST_COUNT = Counter(
    "nextfolio_http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status"]
)

REQUEST_LATENCY = Histogram(
    "nextfolio_http_request_latency_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"]
)

AGENT_EXECUTION_TIME = Histogram(
    "nextfolio_agent_execution_time_seconds",
    "Agent execution time in seconds",
    ["agent_name", "status"]
)

def instrument_app(app: FastAPI):
    """Instruments the FastAPI application with custom Prometheus metrics and OpenTelemetry trace providers."""
    # 1. OpenTelemetry Setup
    try:
        provider = TracerProvider()
        processor = BatchSpanProcessor(ConsoleSpanExporter())
        provider.add_span_processor(processor)
        trace.set_tracer_provider(provider)
        
        FastAPIInstrumentor.instrument_app(app)
        logger.info("OpenTelemetry tracing successfully instrumented.")
    except Exception as e:
        logger.warning(f"OpenTelemetry instrumentation failed: {e}. Moving on.")

    # 2. Prometheus Middleware
    @app.middleware("http")
    async def prometheus_middleware(request: Request, call_next):
        start_time = time.time()
        method = request.method
        endpoint = request.url.path
        
        response = await call_next(request)
        
        status = response.status_code
        latency = time.time() - start_time
        
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status).inc()
        REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(latency)
        
        return response

def metrics_route(request: Request) -> Response:
    """FastAPI route that returns Prometheus-formatted scraper metrics."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
