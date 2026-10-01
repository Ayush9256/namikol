const STORAGE_KEY = "namikol_addresses";

// Get all addresses
export const getStoredAddresses = () => {
  try {
    const storedAddresses = localStorage.getItem(STORAGE_KEY);

    if (!storedAddresses) {
      return [];
    }

    return JSON.parse(storedAddresses);
  } catch (error) {
    console.error("Failed to read addresses:", error);
    return [];
  }
};

// Save all addresses
export const saveAddresses = (addresses) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    return true;
  } catch (error) {
    console.error("Failed to save addresses:", error);
    return false;
  }
};

// Get addresses for a specific customer
export const getAddressesByCustomer = (customerId) => {
  const addresses = getStoredAddresses();

  return addresses.filter(
    (address) => address.customerId === customerId
  );
};

// Add a new address
export const addAddress = (customerId, addressData) => {
  const addresses = getStoredAddresses();

  const newAddress = {
    ...addressData,
    id: `address-${Date.now()}`,
    customerId,
    createdAt: new Date().toISOString(),
  };

  let updatedAddresses = [...addresses, newAddress];

  // If this is the first/default address,
  // make sure only this address is default
  if (newAddress.isDefault) {
    updatedAddresses = updatedAddresses.map((address) =>
      address.customerId === customerId
        ? {
            ...address,
            isDefault: address.id === newAddress.id,
          }
        : address
    );
  }

  saveAddresses(updatedAddresses);

  return {
    success: true,
    message: "Address added successfully.",
    addresses: updatedAddresses.filter(
      (address) => address.customerId === customerId
    ),
  };
};

// Update an existing address
export const updateAddress = (
  customerId,
  addressId,
  addressData
) => {
  const addresses = getStoredAddresses();

  const addressExists = addresses.some(
    (address) =>
      address.id === addressId &&
      address.customerId === customerId
  );

  if (!addressExists) {
    return {
      success: false,
      message: "Address not found.",
      addresses: getAddressesByCustomer(customerId),
    };
  }

  let updatedAddresses = addresses.map((address) =>
    address.id === addressId &&
    address.customerId === customerId
      ? {
          ...address,
          ...addressData,
          id: address.id,
          customerId: address.customerId,
          updatedAt: new Date().toISOString(),
        }
      : address
  );

  // If updated address is default,
  // remove default from other customer addresses
  const updatedAddress = updatedAddresses.find(
    (address) => address.id === addressId
  );

  if (updatedAddress?.isDefault) {
    updatedAddresses = updatedAddresses.map((address) =>
      address.customerId === customerId
        ? {
            ...address,
            isDefault: address.id === addressId,
          }
        : address
    );
  }

  saveAddresses(updatedAddresses);

  return {
    success: true,
    message: "Address updated successfully.",
    addresses: updatedAddresses.filter(
      (address) => address.customerId === customerId
    ),
  };
};

// Delete an address
export const deleteAddress = (customerId, addressId) => {
  const addresses = getStoredAddresses();

  const addressToDelete = addresses.find(
    (address) =>
      address.id === addressId &&
      address.customerId === customerId
  );

  if (!addressToDelete) {
    return {
      success: false,
      message: "Address not found.",
      addresses: getAddressesByCustomer(customerId),
    };
  }

  let updatedAddresses = addresses.filter(
    (address) =>
      !(
        address.id === addressId &&
        address.customerId === customerId
      )
  );

  // If the deleted address was default,
  // make the first remaining address default
  if (addressToDelete.isDefault) {
    const remainingCustomerAddresses = updatedAddresses.filter(
      (address) => address.customerId === customerId
    );

    if (remainingCustomerAddresses.length > 0) {
      const newDefaultId = remainingCustomerAddresses[0].id;

      updatedAddresses = updatedAddresses.map((address) =>
        address.customerId === customerId
          ? {
              ...address,
              isDefault: address.id === newDefaultId,
            }
          : address
      );
    }
  }

  saveAddresses(updatedAddresses);

  return {
    success: true,
    message: "Address deleted successfully.",
    addresses: updatedAddresses.filter(
      (address) => address.customerId === customerId
    ),
  };
};

// Set an address as default
export const setDefaultAddress = (
  customerId,
  addressId
) => {
  const addresses = getStoredAddresses();

  const addressExists = addresses.some(
    (address) =>
      address.id === addressId &&
      address.customerId === customerId
  );

  if (!addressExists) {
    return {
      success: false,
      message: "Address not found.",
      addresses: getAddressesByCustomer(customerId),
    };
  }

  const updatedAddresses = addresses.map((address) =>
    address.customerId === customerId
      ? {
          ...address,
          isDefault: address.id === addressId,
        }
      : address
  );

  saveAddresses(updatedAddresses);

  return {
    success: true,
    message: "Default address updated.",
    addresses: updatedAddresses.filter(
      (address) => address.customerId === customerId
    ),
  };
};

// Clear all addresses
export const clearAddresses = () => {
  localStorage.removeItem(STORAGE_KEY);
};