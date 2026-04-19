import { jwtDecode } from "jwt-decode";

interface JwtPayload {
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"?: string;
    [key: string]: any;
}

export const getCurrentUserId = (): string | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        const decoded: JwtPayload = jwtDecode(token);
        return decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || null;
    } catch (error) {
        return null;
    }
};
