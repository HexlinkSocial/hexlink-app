import React from "react";

interface TableProps {
  children: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ children }) => {
  return <div className="custom-table">{children}</div>;
};

export default Table;
