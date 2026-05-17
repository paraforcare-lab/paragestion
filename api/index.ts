/**
 * api/index.ts — Vercel Serverless Function entry point
 *
 * Vercel routes every /api/* request here via the rewrites in vercel.json.
 * We wrap the existing Express router so no API logic changes are needed.
 *
 * @vercel/node transpiles this TypeScript file automatically before running
 * it in Node.js 20.x — no manual compilation step is required.
 */

import 'dotenv/config'
import express from 'express'
import type { Request, Response } from 'express'
// Import without .js extension — @vercel/node resolves .ts files directly
import apiRouter from '../src/routes/api'

const app = express()

// Body parser limits must match server.ts
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Vercel strips /api from req.url before forwarding to this function,
// so the router sees paths like /bons-commande/5/statut directly.
app.use('/', apiRouter)

// Vercel serverless handler — receives (req, res) for every matched request
export default function handler(req: Request, res: Response) {
  return app(req, res)
}
