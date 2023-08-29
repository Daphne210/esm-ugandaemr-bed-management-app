import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  DataTable,
  DataTableSkeleton,
  Pagination,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@carbon/react";

import {
  useBedsForLocation,
  useLocationName,
} from "../bed-management-summary/summary.resource";
import BedManagementHeader from "../bed-management-header/bed-management-header.component";
import styles from "./bed-location.scss";
import { usePagination } from "@openmrs/esm-framework";

type RouteParams = { location: string };

const BedLocation: React.FC = () => {
  const { location } = useParams<RouteParams>();
  const { isLoading, bedData } = useBedsForLocation(location);
  const { name } = useLocationName(location);
  const [pageSize, setPageSize] = useState(10);
  const {
    results: paginatedData,
    goTo,
    currentPage,
  } = usePagination(bedData, pageSize);

  if (isLoading) {
    <p>Loading...</p>;
  }

  const tableHeaders = [
    {
      id: 0,
      header: "ID",
      key: "id",
    },
    {
      id: 1,
      header: "Number",
      key: "number",
    },
    {
      id: 2,
      header: "Name",
      key: "name",
    },
    {
      id: 3,
      header: "Description",
      key: "description",
    },
    {
      id: 4,
      header: "Status",
      key: "status",
    },
  ];

  const tableRows = useMemo(() => {
    return paginatedData?.map((bed) => ({
      ...bed,
    }));
  }, [paginatedData]);

  return (
    <>
      <BedManagementHeader route={name ? name : "--"} />
      {isLoading && (
        <div className={styles.container}>
          <DataTableSkeleton role="progressbar" zebra />
        </div>
      )}

      {bedData?.length ? (
        <div className={styles.container}>
          <DataTable rows={tableRows} headers={tableHeaders} useZebraStyles>
            {({
              rows,
              headers,
              getHeaderProps,
              getRowProps,
              getTableProps,
            }) => (
              <TableContainer>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader
                          key={header.key}
                          {...getHeaderProps({ header })}
                        >
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.value?.content ?? cell.value}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DataTable>
          <Pagination
            backwardText="Previous page"
            forwardText="Next page"
            itemsPerPageText="Items per page:"
            page={currentPage}
            pageNumberText="Page Number"
            pageSize={pageSize}
            onChange={({ page, pageSize }) => {
              goTo(page);
              setPageSize(pageSize);
            }}
            pageSizes={[10, 20]}
            totalItems={paginatedData?.length}
          />
        </div>
      ) : null}
    </>
  );
};

export default BedLocation;
