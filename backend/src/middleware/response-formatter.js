/**
 * Standardized API response format
 */
export function respondWithSuccess(res, data = null, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Response builder for consistent formatting
 */
export class ApiResponse {
  static ok(data, message = "Success") {
    return { success: true, message, data, timestamp: new Date().toISOString() };
  }

  static created(data, message = "Created successfully") {
    return { success: true, message, data, timestamp: new Date().toISOString() };
  }

  static accepted(data, message = "Request accepted") {
    return { success: true, message, data, timestamp: new Date().toISOString() };
  }

  static noContent() {
    return { success: true, message: "No content", data: null, timestamp: new Date().toISOString() };
  }

  static list(items, total, page = 1, pageSize = 20) {
    return {
      success: true,
      message: "List retrieved successfully",
      data: {
        items,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  static paginated(items, total, pageNumber, pageSize) {
    const totalPages = Math.ceil(total / pageSize);
    return {
      success: true,
      message: "Paginated list retrieved successfully",
      data: {
        items,
        pagination: {
          pageNumber,
          pageSize,
          total,
          totalPages,
          hasNextPage: pageNumber < totalPages,
          hasPreviousPage: pageNumber > 1,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Middleware to add response helpers to res object
 */
export function responseFormatter(req, res, next) {
  res.sendSuccess = (data, message, statusCode = 200) => {
    return res.status(statusCode).json(
      ApiResponse.ok(data, message)
    );
  };

  res.sendCreated = (data, message = "Created successfully") => {
    return res.status(201).json(
      ApiResponse.created(data, message)
    );
  };

  res.sendList = (items, total, page = 1, pageSize = 20) => {
    return res.status(200).json(
      ApiResponse.list(items, total, page, pageSize)
    );
  };

  res.sendPaginated = (items, total, pageNumber, pageSize) => {
    return res.status(200).json(
      ApiResponse.paginated(items, total, pageNumber, pageSize)
    );
  };

  next();
}
