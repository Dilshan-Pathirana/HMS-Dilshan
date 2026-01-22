import React from "react";

const SalesShoppingCartTableHeader: React.FC = () => {
    return (
        <thead>
            <tr>
                <th className="py-2">Product</th>
                <th className="py-2">Price</th>
                <th className="py-2">Discount</th>
                <th className="py-2">Quantity</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Action</th>
            </tr>
        </thead>
    );
};

export default SalesShoppingCartTableHeader;
