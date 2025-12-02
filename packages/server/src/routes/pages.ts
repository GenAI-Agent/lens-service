/**
 * Lens Service v3 - Pages Routes
 *
 * API routes for AI-generated pages.
 */

import { Router, type Request, type Response } from 'express';
import { DatabaseService } from '@lens-service/core';

export interface PagesRouterDependencies {
  databaseService: DatabaseService;
}

export function createPagesRouter(deps: PagesRouterDependencies) {
  const router = Router();
  const { databaseService } = deps;

  /**
   * GET /pages/:pageId
   * Get a generated page by ID
   */
  router.get('/:pageId', async (req: Request, res: Response) => {
    const { pageId } = req.params;

    try {
      const result = await databaseService.select({
        tableName: 'ai_pages',
        conditions: { id: pageId },
      });

      if (!result.success || result.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Page not found',
        });
      }

      const page = result.data[0];

      // Check if page has expired
      if (page.expires_at && new Date(page.expires_at as string) < new Date()) {
        return res.status(410).json({
          success: false,
          error: 'Page has expired',
        });
      }

      // Increment view count
      await databaseService.query(
        'UPDATE ai_pages SET view_count = view_count + 1 WHERE id = $1',
        [pageId]
      );

      // Return HTML or JSON based on Accept header
      const acceptHeader = req.headers.accept || '';

      if (acceptHeader.includes('text/html')) {
        res.setHeader('Content-Type', 'text/html');
        return res.send(page.html);
      }

      return res.json({
        success: true,
        page: {
          id: page.id,
          title: page.title,
          theme: page.theme,
          html: page.html,
          metadata: page.metadata,
          createdAt: page.created_at,
          expiresAt: page.expires_at,
          viewCount: page.view_count,
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Pages] Error:', errorMsg);

      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve page',
      });
    }
  });

  /**
   * GET /pages/:pageId/html
   * Get just the HTML content
   */
  router.get('/:pageId/html', async (req: Request, res: Response) => {
    const { pageId } = req.params;

    try {
      const result = await databaseService.select({
        tableName: 'ai_pages',
        columns: ['html', 'expires_at'],
        conditions: { id: pageId },
      });

      if (!result.success || result.data.length === 0) {
        return res.status(404).send('Page not found');
      }

      const page = result.data[0];

      // Check expiry
      if (page.expires_at && new Date(page.expires_at as string) < new Date()) {
        return res.status(410).send('Page has expired');
      }

      res.setHeader('Content-Type', 'text/html');
      return res.send(page.html);
    } catch (error) {
      return res.status(500).send('Internal server error');
    }
  });

  /**
   * GET /pages
   * List recent pages (admin only)
   */
  router.get('/', async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    try {
      const result = await databaseService.select({
        tableName: 'ai_pages',
        columns: ['id', 'title', 'theme', 'created_at', 'expires_at', 'view_count', 'created_by'],
        orderBy: [{ column: 'created_at', direction: 'DESC' }],
        limit,
        offset,
      });

      // Get total count
      const countResult = await databaseService.query(
        'SELECT COUNT(*) as total FROM ai_pages'
      );

      return res.json({
        success: true,
        pages: result.data,
        pagination: {
          total: parseInt(countResult.data[0]?.total as string) || 0,
          limit,
          offset,
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Pages] List error:', errorMsg);

      return res.status(500).json({
        success: false,
        error: 'Failed to list pages',
      });
    }
  });

  /**
   * DELETE /pages/:pageId
   * Delete a page (admin only)
   */
  router.delete('/:pageId', async (req: Request, res: Response) => {
    const { pageId } = req.params;

    try {
      const result = await databaseService.delete({
        tableName: 'ai_pages',
        conditions: { id: pageId },
      });

      if (!result.success || result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Page not found',
        });
      }

      return res.json({
        success: true,
        message: 'Page deleted',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Pages] Delete error:', errorMsg);

      return res.status(500).json({
        success: false,
        error: 'Failed to delete page',
      });
    }
  });

  return router;
}
