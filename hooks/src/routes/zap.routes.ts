import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// Schema for request validation
const createZapSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  trigger: z.object({
    type: z.string().min(1, 'Trigger type is required'),
    metadata: z.record(z.any()).optional(),
  }),
  actions: z.array(
    z.object({
      type: z.string().min(1, 'Action type is required'),
      metadata: z.record(z.any()).optional(),
      sortingOrder: z.number().default(0),
    })
  ),
  userId: z.string().min(1, 'User ID is required'),
});

// Error handling middleware
const handleError = (error: any, res: Response) => {
  console.error('Error:', error);
  const status = error.status || 500;
  const message = error.message || 'An unexpected error occurred';
  res.status(status).json({ success: false, message });
};

// Get all zaps for a user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const zaps = await prisma.zap.findMany({
      where: { 
        userId: parseInt(userId as string),
        status: 'active',
      },
      include: {
        trigger: true,
        actions: {
          orderBy: {
            sortingOrder: 'asc',
          },
        },
      },
    });

    res.json(zaps);
  } catch (error) {
    handleError(error, res);
  }
});

// Get a single zap by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const zap = await prisma.zap.findUnique({
      where: { id },
      include: {
        trigger: true,
        actions: {
          orderBy: {
            sortingOrder: 'asc',
          },
        },
      },
    });

    if (!zap) {
      return res.status(404).json({ 
        success: false, 
        message: 'Zap not found' 
      });
    }

    res.json(zap);
  } catch (error) {
    handleError(error, res);
  }
});

// Create a new zap
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createZapSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // Create the zap
      const zap = await tx.zap.create({
        data: {
          name: data.name,
          userId: parseInt(data.userId),
          status: 'active',
        },
      });

      // Create the trigger
      await tx.trigger.create({
        data: {
          zapId: zap.id,
          type: data.trigger.type,
          metadata: data.trigger.metadata || {},
        },
      });

      // Create actions
      const actions = await Promise.all(
        data.actions.map((action, index) =>
          tx.action.create({
            data: {
              zapId: zap.id,
              type: action.type,
              metadata: action.metadata || {},
              sortingOrder: action.sortingOrder || index,
            },
          })
        )
      );

      return { ...zap, actions };
    });

    res.status(201).json(result);
  } catch (error) {
    handleError(error, res);
  }
});

// Update a zap
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = createZapSchema.partial().parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // Update the zap
      const zap = await tx.zap.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.trigger && {
            trigger: {
              update: {
                type: data.trigger.type,
                metadata: data.trigger.metadata || {},
              },
            },
          }),
        },
        include: {
          trigger: true,
          actions: true,
        },
      });

      // Update actions if provided
      if (data.actions) {
        // Delete existing actions
        await tx.action.deleteMany({
          where: { zapId: id },
        });

        // Create new actions
        await Promise.all(
          data.actions.map((action, index) =>
            tx.action.create({
              data: {
                zapId: id,
                type: action.type,
                metadata: action.metadata || {},
                sortingOrder: action.sortingOrder || index,
              },
            })
          )
        );
      }

      // Return the updated zap with relations
      return tx.zap.findUnique({
        where: { id },
        include: {
          trigger: true,
          actions: {
            orderBy: {
              sortingOrder: 'asc',
            },
          },
        },
      });
    });

    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});

// Delete a zap (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.zap.update({
      where: { id },
      data: { status: 'deleted' },
    });

    res.json({ success: true, message: 'Zap deleted successfully' });
  } catch (error) {
    handleError(error, res);
  }
});

// Get zap runs
router.get('/:id/runs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '10', offset = '0' } = req.query;

    const runs = await prisma.zapRun.findMany({
      where: { zapId: id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string) || 10,
      skip: parseInt(offset as string) || 0,
    });

    res.json(runs);
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
