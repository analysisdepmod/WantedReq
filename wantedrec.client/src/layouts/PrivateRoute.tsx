import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { IRules, ILoginResponse } from "../Interfaces/GeneralInterface";
import { RootState } from "../../app/store";
import { useSelector } from "react-redux";

interface PrivateRouteProps extends IRules {
    children?: ReactNode;
}

function PrivateRoute({ allowedRules, children }: PrivateRouteProps) {
    const location = useLocation();
    const auth: ILoginResponse = useSelector((state: RootState) => state.auth.loginResponse);

    if (!auth?.loginStatus) {
        return <Navigate to="/login" state={{ from: location }}  />;
    }

    if (!auth.passwordChange) {
        return <Navigate to="/change" state={{ from: location }}  />;
    }

    const isAuthorized = auth.userRoles.some((role) => allowedRules.includes(role));

    if (!isAuthorized) {
        return <Navigate to="/accessdenied" state={{ from: location }}  />;
    }

    return <>{children ? children : <Outlet />}</>;
}

export default PrivateRoute;
