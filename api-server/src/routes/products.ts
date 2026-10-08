import { Router, Request, Response } from "express";
import mockData from "../data/mock-data.json";

const router = Router();

// Type definitions
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
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

// GET /products - List products with filtering, sorting, pagination
router.get("/", (req: Request, res: Response<PaginatedResponse<Product> | any>) => {
  try {
    const rawPage = req.query.page;
    const rawLimit = req.query.limit;
    const page = rawPage === undefined ? 1 : Number(rawPage);
    const limit = rawLimit === undefined ? 10 : Number(rawLimit);
    const sortBy = typeof req.query.sort === "string" ? req.query.sort : "id";
    const category = typeof req.query.category === "string" ? req.query.category.toLowerCase() : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : undefined;
    const minPrice = req.query.minPrice !== undefined && req.query.minPrice !== null && req.query.minPrice !== "" ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== null && req.query.maxPrice !== "" ? Number(req.query.maxPrice) : null;

    // Validate numeric parameters
    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        error: "Invalid page parameter",
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        error: "Invalid limit parameter",
      });
    }

    if (minPrice !== null && (!Number.isFinite(minPrice))) {
      return res.status(400).json({
        success: false,
        error: "Invalid minPrice parameter. Must be a number.",
      });
    }

    if (maxPrice !== null && (!Number.isFinite(maxPrice))) {
      return res.status(400).json({
        success: false,
        error: "Invalid maxPrice parameter. Must be a number.",
      });
    }

    // Validate sort field
    const validSortFields = ["id", "name", "price", "category", "stock"];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sort field. Must be one of: ${validSortFields.join(", ")}`,
      });
    }

    // Start with all products
    let products: Product[] = [...mockData.products];

    // Apply filters
    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }

    if (category) {
      products = products.filter((p) => p.category.toLowerCase() === category);
    }

    if (minPrice !== null) {
      products = products.filter((p) => p.price >= minPrice);
    }

    if (maxPrice !== null) {
      products = products.filter((p) => p.price <= maxPrice);
    }

    // Apply sorting
    products.sort((a, b) => {
      const aVal = a[sortBy as keyof Product];
      const bVal = b[sortBy as keyof Product];

      if (typeof aVal === "number" && typeof bVal === "number") {
        return aVal - bVal;
      }

      return String(aVal).localeCompare(String(bVal));
    });

    // Apply pagination
    const total = products.length;
    const startIdx = (page - 1) * limit;
    const paginatedProducts = products.slice(startIdx, startIdx + limit);

    res.status(200).json({
      success: true,
      data: paginatedProducts,
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

export default router;
