import React from "react";

interface TableRowProps {
  children: React.ReactNode;
}

const TableRow: React.FC<TableRowProps> = ({ children }) => {
  return <div className="custom-table-row">{children}</div>;
};

export default TableRow;
