import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?
        import.meta.env.VITE_API_URL + "/api/v1" :
        "/api/v1",
    timeout: 120000,
});

export const generateSchema = (data) => api.post("/schemas/generate", data);