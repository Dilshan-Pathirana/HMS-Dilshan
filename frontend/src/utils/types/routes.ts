import React from "react";

export interface RouteItem {
    path?: string;
    element: React.ReactNode;
    children?: RouteItem[];
    index?: boolean;
}
