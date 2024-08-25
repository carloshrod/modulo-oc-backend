export const generateSku = (productName) => {
  const namePart = productName.substring(0, 3).toUpperCase();

  const timestampPart = Date.now().toString();

  const newSku = `${namePart}-${timestampPart}`;

  return newSku;
};
