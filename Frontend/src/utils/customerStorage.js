const STORAGE_KEY = "namikol_customers";

export const getStoredCustomers = () => {
  try {
    const storedCustomers = localStorage.getItem(STORAGE_KEY);

    if (!storedCustomers) {
      return [];
    }

    return JSON.parse(storedCustomers);
  } catch (error) {
    console.error("Failed to read customers:", error);
    return [];
  }
};

export const saveCustomers = (customers) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    return true;
  } catch (error) {
    console.error("Failed to save customers:", error);
    return false;
  }
};

export const addCustomer = (customer) => {
  const customers = getStoredCustomers();

  const existingCustomer = customers.find(
    (item) => item.email.toLowerCase() === customer.email.toLowerCase()
  );

  if (existingCustomer) {
    return {
      success: false,
      message: "An account with this email already exists.",
      customer: null,
    };
  }

  const newCustomer = {
    ...customer,
    id: `customer-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const updatedCustomers = [...customers, newCustomer];

  saveCustomers(updatedCustomers);

  return {
    success: true,
    message: "Customer created successfully.",
    customer: newCustomer,
  };
};

export const getCustomerById = (id) => {
  const customers = getStoredCustomers();

  return customers.find((customer) => customer.id === id) || null;
};

export const getCustomerByEmail = (email) => {
  const customers = getStoredCustomers();

  return (
    customers.find(
      (customer) =>
        customer.email.toLowerCase() === email.toLowerCase()
    ) || null
  );
};

export const updateCustomer = (id, updatedData) => {
  const customers = getStoredCustomers();

  const newEmail = updatedData.email?.trim().toLowerCase();

  if (newEmail) {
    const emailAlreadyUsed = customers.some(
      (customer) =>
        customer.id !== id &&
        customer.email.toLowerCase() === newEmail
    );

    if (emailAlreadyUsed) {
      return {
        success: false,
        message: "An account with this email already exists.",
        customer: null,
      };
    }
  }

  const updatedCustomers = customers.map((customer) =>
    customer.id === id
      ? {
          ...customer,
          ...updatedData,
          email: newEmail || customer.email,
          id: customer.id,
          updatedAt: new Date().toISOString(),
        }
      : customer
  );

  saveCustomers(updatedCustomers);

  return {
    success: true,
    message: "Profile updated successfully.",
    customer:
      updatedCustomers.find((customer) => customer.id === id) || null,
  };
};

export const deleteCustomer = (id) => {
  const customers = getStoredCustomers();

  const updatedCustomers = customers.filter(
    (customer) => customer.id !== id
  );

  saveCustomers(updatedCustomers);

  return updatedCustomers;
};

export const clearCustomers = () => {
  localStorage.removeItem(STORAGE_KEY);
};