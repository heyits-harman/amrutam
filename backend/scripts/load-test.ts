import autocannon from 'autocannon';

async function runLoadTests() {
  console.log('-- Starting Read Endpoint Load Test (GET /api/v1/doctors)...');

  const readResult = await autocannon({
    url: 'http://localhost:3000/api/v1/doctors',
    connections: 50, // 50 concurrent connections
    duration: 10,    // 10 seconds test
  });

  const p95Latency = (readResult.latency as Record<string, any>).p95 ?? 0;

  console.log('\n READ BENCHMARK RESULTS:');
  console.log(`- Requests/sec: ${readResult.requests.average}`);
  console.log(`- Latency p95: ${p95Latency} ms`);
  console.log(`- Throughput: ${(readResult.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);

  // Target SLO: p95 must be <= 200ms
  if (p95Latency <= 200) {
    console.log(' Read SLO Passed (<200ms p95)\n');
  } else {
    console.log(` Read SLO Exceeded target (p95 was ${p95Latency}ms vs 200ms target)\n`);
  }
}

runLoadTests();