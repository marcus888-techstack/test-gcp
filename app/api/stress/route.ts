import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const iterations = body.iterations || 1000000

    const startTime = Date.now()
    const startCPU = process.cpuUsage()

    // CPU-intensive task
    let result = 0
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.random()
    }

    const endTime = Date.now()
    const endCPU = process.cpuUsage(startCPU)

    const duration = endTime - startTime
    const cpuTime = (endCPU.user + endCPU.system) / 1000 // Convert to milliseconds

    return NextResponse.json({
      duration,
      iterations,
      cpuTime,
      result,
      service: process.env.K_SERVICE || 'local',
      revision: process.env.K_REVISION || 'local',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Stress test failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}