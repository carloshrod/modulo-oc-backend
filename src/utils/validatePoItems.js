export const validatePoItems = (items) => {
  try {
    const validItems = items.filter(
      (item) => item?.general_item_id !== undefined
    );
    return validItems;
  } catch (error) {
    console.error(error);
  }
};
