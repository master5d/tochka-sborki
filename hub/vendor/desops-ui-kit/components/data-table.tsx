"use client";

import * as React from "react";
import { DataGrid, type DataGridProps } from "@mui/x-data-grid";

export function DataTable(props: DataGridProps) {
  return (
    <div className="w-full h-[400px]">
      <DataGrid
        {...props}
        sx={{
          border: 'none',
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            color: 'var(--md-sys-color-on-surface-variant)',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          },
          '& .MuiDataGrid-footerContainer': {
            backgroundColor: 'var(--md-sys-color-surface-container-high)',
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
            color: 'var(--md-sys-color-on-surface-variant)',
          },
          '& .MuiCheckbox-root': {
            color: 'var(--md-sys-color-primary)',
          },
          '& .MuiTablePagination-root': {
            color: 'var(--md-sys-color-on-surface-variant)',
          },
          ...props.sx,
        }}
      />
    </div>
  );
}
