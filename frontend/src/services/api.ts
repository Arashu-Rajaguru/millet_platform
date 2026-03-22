export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  
  // Create headers objects dynamically 
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };
  
  if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errStr = "Network error when fetching resources";
    try {
        const errorData = await response.json();
        errStr = errorData.detail || errStr;
    } catch(e) {}
    throw new Error(errStr);
  }

  return response.json();
};

export const api = {
    login: (data: FormData) => fetch(`${API_URL}/auth/login`, { method: "POST", body: data }).then(async res => {
        if (!res.ok) {
            let errStr = "Login failed";
            try {
                const err = await res.json();
                errStr = err.detail || errStr;
            } catch(e) {}
            throw new Error(errStr);
        }
        return res.json();
    }),
    register: (data: any) => fetchWithAuth("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    getMe: () => fetchWithAuth("/auth/me"),
    updateMe: (data: any) => fetchWithAuth("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
    getProducts: () => fetchWithAuth("/products/"),
    createProduct: (data: any) => fetchWithAuth("/products/", { method: "POST", body: JSON.stringify(data) }),
    updateProduct: (id: number, data: any) => fetchWithAuth(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    getTransactions: () => fetchWithAuth("/transactions/"),
    createTransaction: (data: any) => fetchWithAuth("/transactions/", { method: "POST", body: JSON.stringify(data) }),
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        return fetchWithAuth("/uploads/", { method: "POST", body: formData });
    },
    predictPrice: (type: string, qty: number, cert: string) => fetch(`${API_URL}/predict-price?millet_type=${type}&quantity=${qty}&certification_status=${cert}`).then(r=>r.json())
};
