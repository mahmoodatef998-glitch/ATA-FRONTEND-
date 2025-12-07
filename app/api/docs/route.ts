/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get API documentation (Swagger JSON)
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger JSON specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

export async function GET() {
  return NextResponse.json(swaggerSpec);
}

