const STORAGE_KEY = "namikol_orders";

export const getStoredOrders = () => {
  try {
    const storedOrders = localStorage.getItem(STORAGE_KEY);

    if (!storedOrders) return [];

    return JSON.parse(storedOrders);
  } catch (error) {
    console.error("Failed to read orders:", error);
    return [];
  }
};

export const saveOrders = (orders) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    return true;
  } catch (error) {
    console.error("Failed to save orders:", error);
    return false;
  }
};

export const createOrder = (orderData) => {
  const orders = getStoredOrders();

  const newOrder = {
    ...orderData,

    id: `order-${Date.now()}`,

    orderNumber: `NMK-${Date.now()
      .toString()
      .slice(-8)}`,

    createdAt: new Date().toISOString(),

    // Successful checkout is treated as paid
    // in the current frontend-only version.
    paymentStatus: "Paid",

    orderStatus: "Placed",

    deliveredAt: null,

    returnStatus: "Not Requested",

    returnRequestedAt: null,

    returnAcceptedAt: null,

    returnReceivedAt: null,

    returnCompletedAt: null,

    returnRejectedAt: null,
  };

  const updatedOrders = [newOrder, ...orders];

  saveOrders(updatedOrders);

  return {
    success: true,
    message: "Order created successfully.",
    order: newOrder,
  };
};

export const getOrdersByCustomer = (customerId) => {
  const orders = getStoredOrders();

  return orders.filter(
    (order) => order.customerId === customerId
  );
};

export const getOrderById = (orderId) => {
  const orders = getStoredOrders();

  return (
    orders.find(
      (order) => order.id === orderId
    ) || null
  );
};

export const updateOrderStatus = (
  orderId,
  orderStatus
) => {
  const orders = getStoredOrders();

  const orderExists = orders.some(
    (order) => order.id === orderId
  );

  if (!orderExists) {
    return {
      success: false,
      message: "Order not found.",
      order: null,
    };
  }

  const updatedOrders = orders.map((order) => {
    if (order.id !== orderId) {
      return order;
    }

    const updatedOrder = {
      ...order,
      orderStatus,
      updatedAt: new Date().toISOString(),
    };

    /*
      Save the exact delivery time when the admin
      changes the order to Delivered.
    */
    if (
      orderStatus === "Delivered" &&
      order.orderStatus !== "Delivered"
    ) {
      updatedOrder.deliveredAt =
        new Date().toISOString();
    }

    /*
      If an order is moved away from Delivered and
      no return has been requested, clear delivery time.
    */
    if (
      orderStatus !== "Delivered" &&
      order.orderStatus === "Delivered" &&
      order.returnStatus === "Not Requested"
    ) {
      updatedOrder.deliveredAt = null;
    }

    return updatedOrder;
  });

  saveOrders(updatedOrders);

  return {
    success: true,
    message: "Order status updated.",
    order:
      updatedOrders.find(
        (order) => order.id === orderId
      ) || null,
  };
};

export const updatePaymentStatus = (
  orderId,
  paymentStatus
) => {
  const orders = getStoredOrders();

  const orderExists = orders.some(
    (order) => order.id === orderId
  );

  if (!orderExists) {
    return {
      success: false,
      message: "Order not found.",
      order: null,
    };
  }

  const updatedOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          paymentStatus,
          updatedAt: new Date().toISOString(),
        }
      : order
  );

  saveOrders(updatedOrders);

  return {
    success: true,
    message: "Payment status updated.",
    order:
      updatedOrders.find(
        (order) => order.id === orderId
      ) || null,
  };
};

/*
  CUSTOMER
  =========
  Request a return.

  Allowed only when:
  1. Order is Delivered
  2. deliveredAt exists
  3. Within 3 days of delivery
  4. No previous return request
*/
export const requestOrderReturn = (orderId) => {
  const orders = getStoredOrders();

  const order = orders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    return {
      success: false,
      message: "Order not found.",
      order: null,
    };
  }

  if (order.orderStatus !== "Delivered") {
    return {
      success: false,
      message:
        "Return can only be requested after delivery.",
      order,
    };
  }

  if (!order.deliveredAt) {
    return {
      success: false,
      message:
        "Delivery date is unavailable for this order.",
      order,
    };
  }

  const deliveredTime = new Date(
    order.deliveredAt
  ).getTime();

  const currentTime = Date.now();

  const threeDaysInMs =
    3 * 24 * 60 * 60 * 1000;

  const timeSinceDelivery =
    currentTime - deliveredTime;

  if (
    timeSinceDelivery < 0 ||
    timeSinceDelivery > threeDaysInMs
  ) {
    return {
      success: false,
      message:
        "The 3-day return window has expired.",
      order,
    };
  }

  if (
    order.returnStatus &&
    order.returnStatus !== "Not Requested"
  ) {
    return {
      success: false,
      message:
        "Return has already been requested.",
      order,
    };
  }

  const updatedOrders = orders.map((item) =>
    item.id === orderId
      ? {
          ...item,

          returnStatus: "Requested",

          returnRequestedAt:
            new Date().toISOString(),

          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveOrders(updatedOrders);

  return {
    success: true,
    message:
      "Return request submitted successfully.",
    order:
      updatedOrders.find(
        (item) => item.id === orderId
      ) || null,
  };
};

/*
  ADMIN
  =====
  Accept a customer's return request.
*/
export const acceptReturnRequest = (orderId) => {
  const orders = getStoredOrders();

  const order = orders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    return {
      success: false,
      message: "Order not found.",
      order: null,
    };
  }

  if (order.returnStatus !== "Requested") {
    return {
      success: false,
      message:
        "This order does not have a pending return request.",
      order,
    };
  }

  const updatedOrders = orders.map((item) =>
    item.id === orderId
      ? {
          ...item,

          returnStatus: "Accepted",

          returnAcceptedAt:
            new Date().toISOString(),

          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveOrders(updatedOrders);

  return {
    success: true,
    message: "Return request accepted.",
    order:
      updatedOrders.find(
        (item) => item.id === orderId
      ) || null,
  };
};

/*
  ADMIN
  =====
  Reject a customer's return request.
*/
export const rejectReturnRequest = (orderId) => {
  const orders = getStoredOrders();

  const order = orders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    return {
      success: false,
      message: "Order not found.",
      order: null,
    };
  }

  if (order.returnStatus !== "Requested") {
    return {
      success: false,
      message:
        "This order does not have a pending return request.",
      order,
    };
  }

  const updatedOrders = orders.map((item) =>
    item.id === orderId
      ? {
          ...item,

          returnStatus: "Rejected",

          returnRejectedAt:
            new Date().toISOString(),

          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveOrders(updatedOrders);

  return {
    success: true,
    message: "Return request rejected.",
    order:
      updatedOrders.find(
        (item) => item.id === orderId
      ) || null,
  };
};

/*
  ADMIN
  =====
  Mark the returned product as received.
*/
export const markReturnReceived = (orderId) => {
  const orders = getStoredOrders();

  const order = orders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    return {
      success: false,
      message: "Order not found.",
      order: null,
    };
  }

  if (order.returnStatus !== "Accepted") {
    return {
      success: false,
      message:
        "Return must be accepted before marking it as received.",
      order,
    };
  }

  const updatedOrders = orders.map((item) =>
    item.id === orderId
      ? {
          ...item,

          returnStatus: "Received",

          returnReceivedAt:
            new Date().toISOString(),

          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveOrders(updatedOrders);

  return {
    success: true,
    message: "Return marked as received.",
    order:
      updatedOrders.find(
        (item) => item.id === orderId
      ) || null,
  };
};

/*
  ADMIN
  =====
  Complete the return.

  IMPORTANT:
  Payment becomes Refunded ONLY here.
*/
export const completeReturn = (orderId) => {
  const orders = getStoredOrders();

  const order = orders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    return {
      success: false,
      message: "Order not found.",
      order: null,
    };
  }

  if (order.returnStatus !== "Received") {
    return {
      success: false,
      message:
        "Return must be received before completing it.",
      order,
    };
  }

  const updatedOrders = orders.map((item) =>
    item.id === orderId
      ? {
          ...item,

          returnStatus: "Completed",

          returnCompletedAt:
            new Date().toISOString(),

          paymentStatus: "Refunded",

          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveOrders(updatedOrders);

  return {
    success: true,
    message:
      "Return completed and payment marked as refunded.",
    order:
      updatedOrders.find(
        (item) => item.id === orderId
      ) || null,
  };
};

/*
  ADMIN
  =====
  Generic return status update.
  Kept available for future admin features.
*/
export const updateReturnStatus = (
  orderId,
  returnStatus
) => {
  const orders = getStoredOrders();

  const orderExists = orders.some(
    (order) => order.id === orderId
  );

  if (!orderExists) {
    return {
      success: false,
      message: "Order not found.",
      order: null,
    };
  }

  const updatedOrders = orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          returnStatus,
          updatedAt: new Date().toISOString(),
        }
      : order
  );

  saveOrders(updatedOrders);

  return {
    success: true,
    message: "Return status updated.",
    order:
      updatedOrders.find(
        (order) => order.id === orderId
      ) || null,
  };
};

export const cancelOrder = (orderId) => {
  const orders = getStoredOrders();

  const order = orders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    return {
      success: false,
      message: "Order not found.",
      order: null,
    };
  }

  const cancellableStatuses = [
    "Placed",
    "Processing",
  ];

  if (
    !cancellableStatuses.includes(
      order.orderStatus
    )
  ) {
    return {
      success: false,
      message:
        "This order can no longer be cancelled.",
      order,
    };
  }

  const updatedOrders = orders.map((item) =>
    item.id === orderId
      ? {
          ...item,

          orderStatus: "Cancelled",

          cancelledAt:
            new Date().toISOString(),

          updatedAt: new Date().toISOString(),
        }
      : item
  );

  saveOrders(updatedOrders);

  return {
    success: true,
    message: "Order cancelled successfully.",
    order:
      updatedOrders.find(
        (item) => item.id === orderId
      ) || null,
  };
};

export const deleteOrder = (orderId) => {
  const orders = getStoredOrders();

  const updatedOrders = orders.filter(
    (order) => order.id !== orderId
  );

  saveOrders(updatedOrders);

  return updatedOrders;
};

export const clearOrders = () => {
  localStorage.removeItem(STORAGE_KEY);
};