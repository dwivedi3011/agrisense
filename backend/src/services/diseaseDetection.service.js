import axios from "axios";
import FormData from "form-data";

const ML_SERVICE_URL = "http://localhost:8000/predict";

export async function detectDisease(fileBuffer, fileName, mimeType) {
  const form = new FormData();
  form.append("file", fileBuffer, { filename: fileName, contentType: mimeType });

  const response = await axios.post(ML_SERVICE_URL, form, {
    headers: form.getHeaders(),
  });

  return response.data;
}