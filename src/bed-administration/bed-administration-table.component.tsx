import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useLayoutType,
  isDesktop as desktopLayout,
  usePagination,
} from "@openmrs/esm-framework";
import { findBedByLocation, useWards } from "../summary/summary.resource";
import { LOCATION_TAG_UUID } from "../constants";
import { CardHeader, ErrorState } from "@openmrs/esm-patient-common-lib";
import {
  DataTable,
  TableContainer,
  DataTableSkeleton,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  InlineLoading,
  TableHead,
  Table,
  Pagination,
  OverflowMenu,
  OverflowMenuItem,
  Button,
} from "@carbon/react";
import { Add } from "@carbon/react/icons";
import type { BedType, InitialData, Location } from "../types";
import NewBedForm from "./new-bed-form.component";
import Header from "../header/header.component";
import styles from "./bed-administration-table.scss";
import EditBedForm from "./edit-bed-form.component";

interface Bed {
  id: number;
  uuid: string;
  bedNumber: string;
  bedType: BedType;
  row: number;
  column: number;
  status: string;
  location: Location;
}

const BedAdminstration: React.FC = () => {
  const { t } = useTranslation();
  const headerTitle = t("wardAllocation", "Ward Allocation");
  const layout = useLayoutType();
  const isTablet = layout === "tablet";
  const isDesktop = desktopLayout(layout);

  const [wardsGroupedByLocations, setWardsGroupedByLocation] = useState(
    Array<Location>
  );
  const [isBedDataLoading, setIsBedDataLoading] = useState(false);
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [showEditBedModal, setShowEditBedModal] = useState(false);
  const [editData, setEditData] = useState<InitialData>();

  const bedsMappedToLocation = wardsGroupedByLocations?.length
    ? [].concat(...wardsGroupedByLocations)
    : [];

  const { data, isLoading, error, isValidating } = useWards(LOCATION_TAG_UUID);
  const [currentPageSize, setPageSize] = useState(10);
  const pageSizes = [10, 20, 30, 40, 50];
  const { results, currentPage, totalPages, goTo } = usePagination(
    bedsMappedToLocation ?? [],
    currentPageSize
  );

  useEffect(() => {
    if (!isLoading && data && !wardsGroupedByLocations.length) {
      setIsBedDataLoading(true);
      const fetchData = async () => {
        const promises = data.data.results.map(async (ward) => {
          const bedLocations = await findBedByLocation(ward.uuid);
          if (bedLocations.data.results.length) {
            return bedLocations.data.results.map((bed) => ({
              ...bed,
              location: ward,
            }));
          }
          return null;
        });

        const updatedWards = (await Promise.all(promises)).filter(Boolean);
        setWardsGroupedByLocation(updatedWards);
        setIsBedDataLoading(false);
      };

      fetchData().finally(() => setIsBedDataLoading(false));
    }
  }, [data, isLoading, wardsGroupedByLocations.length]);

  const tableHeaders = [
    {
      key: "bedNumber",
      header: t("bedId", "Bed ID"),
    },
    {
      key: "location",
      header: t("location", "Location"),
    },
    {
      key: "occupationStatus",
      header: t("occupationStatus", "Occupation Status"),
    },
    {
      key: "currentStatus",
      header: t("currentStatus", "Current Status"),
    },
    {
      key: "actions",
      header: t("actions", "Actions"),
    },
  ];

  const bedActions = useMemo(
    () => [
      {
        label: t("allocate", "Allocate"),
        form: {
          name: "bed-administration-form",
        },
        mode: "view",
        intent: "*",
      },
      {
        label: t("editBed", "Edit"),
        form: {
          name: "bed-administration-form",
        },
        mode: "view",
        intent: "*",
      },
    ],
    [t]
  );

  const tableRows = useMemo(() => {
    return results.map((ward) => {
      return {
        id: ward.uuid,
        bedNumber: ward.bedNumber,
        location: ward.location.display,
        currentStatus: ward.status,
        occupationStatus: "--",
        actions: (
          <OverflowMenu flipped className={styles.flippedOverflowMenu}>
            {bedActions.map((actionItem) => (
              <OverflowMenuItem
                itemText={actionItem.label}
                onClick={(e) => {
                  if (actionItem.label === "Edit") {
                    setEditData(ward);
                    setShowEditBedModal(true);
                    setShowAddBedModal(false);
                  }
                  e.preventDefault();
                }}
              />
            ))}
          </OverflowMenu>
        ),
      };
    });
  }, [bedActions, results]);

  return (
    <>
      <Header route={"Administration"} />
      {isBedDataLoading || isLoading ? (
        <div className={styles.widgetCard}>
          <DataTableSkeleton role="progressbar" compact={isDesktop} zebra />
        </div>
      ) : null}
      {error ? (
        <div className={styles.widgetCard}>
          <ErrorState error={error} headerTitle={headerTitle} />
        </div>
      ) : null}
      {tableRows?.length ? (
        <div className={styles.widgetCard}>
          {showAddBedModal ? (
            <NewBedForm
              onModalChange={setShowAddBedModal}
              showModal={showAddBedModal}
            />
          ) : null}
          {showEditBedModal ? (
            <EditBedForm
              onModalChange={setShowEditBedModal}
              showModal={showEditBedModal}
              editData={editData}
            />
          ) : null}
          <CardHeader title={headerTitle}>
            <span>
              {isValidating ? (
                <InlineLoading />
              ) : (
                <Button
                  kind="ghost"
                  renderIcon={(props) => <Add size={16} {...props} />}
                  onClick={() => setShowAddBedModal(true)}
                >
                  {t("addBed", "Add bed")}
                </Button>
              )}
            </span>
          </CardHeader>
          <DataTable
            rows={tableRows}
            headers={tableHeaders}
            isSortable
            size={isTablet ? "lg" : "sm"}
            useZebraStyles
          >
            {({ rows, headers, getTableProps }) => (
              <TableContainer>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHeader>
                          {header.header?.content ?? header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.value?.content ?? cell.value}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Pagination
                  backwardText="Previous page"
                  forwardText="Next page"
                  page={currentPage}
                  pageNumberText="Page Number"
                  pageSize={totalPages}
                  pageSizes={pageSizes?.length > 0 ? pageSizes : [10]}
                  totalItems={bedsMappedToLocation.length ?? 0}
                  onChange={({ pageSize, page }) => {
                    if (pageSize !== currentPageSize) {
                      setPageSize(pageSize);
                    }
                    if (page !== currentPage) {
                      goTo(page);
                    }
                  }}
                />
              </TableContainer>
            )}
          </DataTable>
        </div>
      ) : null}
    </>
  );
};

export default BedAdminstration;