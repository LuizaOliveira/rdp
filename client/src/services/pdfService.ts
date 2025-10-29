import axios from "axios";

/**
 * Fetches available years from the backend.
 * @returns A promise that resolves to an array of years.
 */
export async function fetchYears(): Promise<string[]> {
  const response = await axios.get("/api/pdf/years");
  return response.data.data;
}