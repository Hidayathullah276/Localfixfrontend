const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const api = {
    get: async (endpoint: string) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });
        
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = responseText;
        }

        if (!response.ok) {
            const errorMsg = data?.message || (typeof data === 'string' ? data : 'An error occurred');
            const error: any = new Error(errorMsg);
            error.data = data;
            error.status = response.status;
            throw error;
        }
        return data;
    },
    post: async (endpoint: string, body: any) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = responseText;
        }

        if (!response.ok) {
            const errorMsg = data?.message || (typeof data === 'string' ? data : 'An error occurred');
            const error: any = new Error(errorMsg);
            error.data = data;
            error.status = response.status;
            throw error;
        }
        return data;
    },
    put: async (endpoint: string, body: any) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = responseText;
        }

        if (!response.ok) {
            const errorMsg = data?.message || (typeof data === 'string' ? data : 'An error occurred');
            const error: any = new Error(errorMsg);
            error.data = data;
            error.status = response.status;
            throw error;
        }
        return data;
    },
    patch: async (endpoint: string, body: any) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = responseText;
        }

        if (!response.ok) {
            const errorMsg = data?.message || (typeof data === 'string' ? data : 'An error occurred');
            const error: any = new Error(errorMsg);
            error.data = data;
            error.status = response.status;
            throw error;
        }
        return data;
    },
    delete: async (endpoint: string) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = responseText;
        }

        if (!response.ok) {
            const errorMsg = data?.message || (typeof data === 'string' ? data : 'An error occurred');
            const error: any = new Error(errorMsg);
            error.data = data;
            error.status = response.status;
            throw error;
        }
        return data;
    }
};
