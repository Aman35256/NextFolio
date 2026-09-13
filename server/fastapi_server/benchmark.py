import time
import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8000"

async def simulate_user(user_id: int, client: httpx.AsyncClient):
    """Simulates a single user running the multi-agent pipeline."""
    payload = {
        "userId": user_id,
        "query": f"Analyze my experience as a Senior Developer for user {user_id}",
        "resumeData": "John Doe. Senior Software Engineer. React, Python, Docker.",
        "jobDescription": "Looking for a Senior Frontend Engineer with React and Docker experience."
    }
    
    start_time = time.time()
    try:
        response = await client.post(f"{BASE_URL}/api/orchestrator/run", json=payload, timeout=30.0)
        latency = time.time() - start_time
        
        if response.status_code == 200:
            res_json = response.json()
            return {
                "user_id": user_id,
                "success": True,
                "latency": latency,
                "orchestration_id": res_json.get("orchestrationId")
            }
        else:
            return {"user_id": user_id, "success": False, "error": f"HTTP {response.status_code}", "latency": latency}
    except Exception as e:
        return {"user_id": user_id, "success": False, "error": str(e), "latency": time.time() - start_time}

async def run_benchmark(concurrent_users: int):
    print(f"=== Starting NextFolio Multi-Agent Platform Benchmark ===")
    print(f"Simulating {concurrent_users} concurrent users...")
    
    limits = httpx.Limits(max_keepalive_connections=concurrent_users, max_connections=concurrent_users)
    async with httpx.AsyncClient(limits=limits) as client:
        # Check health first
        try:
            health = await client.get(f"{BASE_URL}/api/health")
            print(f"Server health status: {health.json()['status']}")
        except Exception:
            print("Error: FastAPI server is not running on http://localhost:8000. Please start it before running the benchmark.")
            sys.exit(1)

        start_time = time.time()
        tasks = [simulate_user(i, client) for i in range(1, concurrent_users + 1)]
        results = await asyncio.gather(*tasks)
        total_time = time.time() - start_time
        
        # Calculate statistics
        successes = [r for r in results if r["success"]]
        failures = [r for r in results if not r["success"]]
        
        latencies = [r["latency"] for r in successes]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        min_latency = min(latencies) if latencies else 0
        max_latency = max(latencies) if latencies else 0
        
        throughput = len(results) / total_time
        
        print("\n=== Benchmark Results ===")
        print(f"Total Simulated Users: {concurrent_users}")
        print(f"Successful Runs      : {len(successes)}")
        print(f"Failed Runs          : {len(failures)}")
        print(f"Total Execution Time : {total_time:.2f} seconds")
        print(f"Throughput           : {throughput:.2f} requests/sec")
        
        if successes:
            print(f"Average Latency      : {avg_latency:.2f} seconds")
            print(f"Min Latency          : {min_latency:.2f} seconds")
            print(f"Max Latency          : {max_latency:.2f} seconds")
        
        if failures:
            print("\n=== Failure Log ===")
            for f in failures[:5]:
                print(f"User {f['user_id']} failed after {f['latency']:.2f}s: {f.get('error')}")

if __name__ == "__main__":
    concurrent = 50
    if len(sys.argv) > 1:
        try:
            concurrent = int(sys.argv[1])
        except ValueError:
            pass
            
    asyncio.run(run_benchmark(concurrent))
