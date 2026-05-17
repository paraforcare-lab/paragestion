/**
 * api/index.ts — Vercel Serverless Function entry point
 *
 * Vercel routes every request matching /api/* here.
 * We wrap the existing Express router so no API logic needs to change.
 *
 * How it works:
 *  - Vercel calls the default export with (req, res) for every /api/* hit
 *  - We create a minimal Express app on each cold start (cached between
 *    invocations by Node module caching) and pass the request through
 */

import 'dotenv/config'
import express from 'express'
import type { Request, Response } from 'express'
import apiRouter from '../src/routes/api.js'

const app = express()

// Must match the limits in server.ts
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Mount the same router — Vercel will strip the /api prefix from req.url
// automatically when routing to this function, so the router sees paths
// like /bons-commande/5/statut directly.
app.use('/', apiRouter)

// Vercel serverless handler signature
export default function handler(req: Request, res: Response) {
  return app(req, res)
}
