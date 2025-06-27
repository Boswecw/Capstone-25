export const handleApiError = (error, customMessage = "An error occurred") => {
  const message =
    error.response?.data?.message || error.message || customMessage;
  console.error("API Error:", error);
  return message;
};
