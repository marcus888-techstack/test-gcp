import { NextResponse } from 'next/server'
import os from 'os'

export async function GET() {
  const info = {
    service: process.env.K_SERVICE || 'local',
    revision: process.env.K_REVISION || 'local',
    configuration: process.env.K_CONFIGURATION || 'local',
    region: process.env.CLOUD_RUN_REGION || process.env.REGION,
    projectId: process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT,
    memory: process.env.MEMORY_LIMIT,
    cpu: process.env.CPU_LIMIT,
    timestamp: new Date().toISOString(),
    hostname: os.hostname(),
    platform: os.platform(),
    cpus: os.cpus().length,
    totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
    freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
  }

  return NextResponse.json(info)
}