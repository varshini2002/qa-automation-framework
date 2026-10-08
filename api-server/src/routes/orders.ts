import { Router, Request, Response } from "express";
import mockData from "../data/mock-data.json";

const router = Router();

// Type definitions
interface Order {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// GET /orders - List orders with filtering and pagination
router.get("/", (req: Request, res: Response<PaginatedResponse<Order> | any>) => {
  try {
    const rawPage = req.query.page;
    const rawLimit = req.query.limit;
    const page = rawPage === undefined ? 1 : Number(rawPage);
    const limit = rawLimit === undefined ? 10 : Number(rawLimit);
    const status = typeof req.query.status === "string" ? req.query.status.toLowerCase() : undefined;
    const rawUserId = req.query.userId;
    const userIdValue = rawUserId === undefined || rawUserId === null || rawUserId === "" ? null : String(rawUserId);
    const userId = userIdValue === null ? null : Number(userIdValue);

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        error: "Invalid page parameter. Must be a positive integer.",
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: "Invalid limit parameter. Must be between 1 and 100.",
      });
    }

    const hasInvalidUserId = userIdValue !== null && (!/^\d+$/.test(userIdValue) || userId === null || !Number.isInteger(userId) || userId <= 0);
    if (hasInvalidUserId) {
      return res.status(400).json({
        success: false,
        error: "Invalid userId",
      });
    }

    const validStatuses = ["pending", "shipped", "completed", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    let orders: Order[] = [...mockData.orders];

    if (status) {
      orders = orders.filter((o) => o.status.toLowerCase() === status);
    }

    if (userId !== null) {
      orders = orders.filter((o) => o.userId === userId);
    }

    const total = orders.length;
    const startIdx = (page - 1) * limit;
    const paginatedOrders = orders.slice(startIdx, startIdx + limit);

    res.status(200).json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// POST /orders - Create a new order
router.post("/", (req: Request, res: Response<{ success: boolean; data?: Order; error?: string }>) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const { userId, productId, quantity } = body as Record<string, unknown>;

    if (userId === undefined || userId === null || userId === "") {
      return res.status(400).json({
        success: false,
        error: "Missing required field: userId",
      });
    }

    if (productId === undefined || productId === null || productId === "") {
      return res.status(400).json({
        success: false,
        error: "Missing required field: productId",
      });
    }

    if (quantity === undefined || quantity === null || quantity === "") {
      return res.status(400).json({
        success: false,
        error: "Missing required field: quantity",
      });
    }

    const userIdNum = Number(userId);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid userId",
      });
    }

    const productIdNum = Number(productId);
    if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid productId",
      });
    }

    const quantityNum = Number(quantity);
    if (!Number.isInteger(quantityNum) || quantityNum <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid quantity",
      });
    }

    const product = mockData.products.find((p) => p.id === productIdNum);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product with id ${productIdNum} not found`,
      });
    }

    if (product.stock < quantityNum) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock`,
      });
    }

    const newOrder: Order = {
      id: Math.max(...mockData.orders.map((o) => o.id), 0) + 1,
      userId: userIdNum,
      productId: productIdNum,
      quantity: quantityNum,
      totalPrice: product.price * quantityNum,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    mockData.orders.push(newOrder);

    res.status(201).json({
      success: true,
      data: newOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
