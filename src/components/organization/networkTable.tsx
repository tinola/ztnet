import { useRouter } from "next/router";
import { useMemo, useState, useEffect, useRef } from "react";
import { DebouncedInput } from "~/components/elements/debouncedInput";
import {
	useReactTable,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	flexRender,
	createColumnHelper,
	type SortingState,
} from "@tanstack/react-table";
import { useSkipper } from "../../hooks/useSkipper";
import { useTranslations } from "next-intl";
import { CentralMemberEntity } from "~/types/central/members";
import { getLocalStorageItem, setLocalStorageItem } from "~/utils/localstorage";
import TableFooter from "~/components/shared/tableFooter";
import { CopyToClipboard } from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import CopyIcon from "~/icons/copy";
import { MemberCounts } from "~/types/local/member";
import { NetworkTableMemberCount } from "../networkPage/networkTableMemberCount";

// import { makeNetworkData } from "../../utils/fakeData";
const TruncateText = ({ text }: { text: string }) => {
	if (!text) return null;
	const shouldTruncate = text?.length > 100;
	return (
		<div
			className={`text-left ${
				shouldTruncate
					? "max-w-[150px] truncate sm:max-w-xs md:overflow-auto md:whitespace-normal"
					: ""
			}`}
		>
			{text}
		</div>
	);
};

const LOCAL_STORAGE_KEY = "centralNetworkTableSorting";

interface OrgMemberEntity extends CentralMemberEntity {
	networkMembers: string[];
	memberCounts: MemberCounts;
}

export const OrganizationNetworkTable = ({ tableData = [] }) => {
	// Load initial state from localStorage or set to default
	const initialSortingState = getLocalStorageItem(LOCAL_STORAGE_KEY, [
		{ id: "nwid", desc: true },
	]);

	const router = useRouter();
	const t = useTranslations();
	const searchInputRef = useRef<HTMLInputElement>(null);

	const [globalFilter, setGlobalFilter] = useState("");
	const [sorting, setSorting] = useState<SortingState>(initialSortingState);

	// Auto-focus search input when component mounts
	useEffect(() => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, []);

	const columnHelper = createColumnHelper<OrgMemberEntity>();
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const columns = useMemo(
		() => [
			columnHelper.accessor("name", {
				cell: (info) => <span className="truncate">{info.getValue()}</span>,
				header: () => <span>{t("commonTable.header.name")}</span>,
			}),
			columnHelper.accessor("description", {
				size: 280,
				cell: (info) => <TruncateText text={info.getValue()} />,
				header: () => <span>{t("commonTable.header.description")}</span>,
			}),
			columnHelper.accessor("nwid", {
				header: () => <span>{t("commonTable.header.networkId")}</span>,
				cell: ({ row: { original } }) => {
					return (
						<div onClick={(e) => e.stopPropagation()}>
							<CopyToClipboard
								text={original.nwid}
								onCopy={() => {
									toast.success(
										t("commonToast.copyToClipboard.success", { element: original.nwid }),
									);
								}}
								title={t("commonToast.copyToClipboard.title")}
							>
								<div className="cursor-pointer flex items-center justify-center">
									{original.nwid}
									<CopyIcon />
								</div>
							</CopyToClipboard>
						</div>
					);
				},
			}),
			columnHelper.accessor("memberCounts", {
				header: () => <span>{t("commonTable.header.memberActTot")}</span>,
				cell: (info) => {
					const data = info.getValue();
					return <NetworkTableMemberCount count={data.display} />;
				},
			}),
		],
		[],
	);

	// Save to localStorage whenever sorting changes
	useEffect(() => {
		setLocalStorageItem(LOCAL_STORAGE_KEY, sorting);
	}, [sorting]);

	useEffect(() => {
		setData(tableData);
	}, [tableData]);

	const [data, setData] = useState(tableData);
	const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
	const table = useReactTable({
		columns,
		data,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		autoResetPageIndex,
		meta: {
			updateData: (rowIndex, columnId, value) => {
				// Skip page index reset until after next rerender
				skipAutoResetPageIndex();
				setData((old: CentralMemberEntity[]) =>
					old.map((row, index) => {
						if (index === rowIndex) {
							return {
								// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
								...old[rowIndex]!,
								[columnId]: value,
							};
						}
						return row;
					}),
				);
			},
		},
		state: {
			sorting,
			globalFilter,
		},
		onGlobalFilterChange: setGlobalFilter,
		getFilteredRowModel: getFilteredRowModel(),
		debugTable: false,
	});
	const handleRowClick = (nwid: string) => {
		const orgId = router.query.orgid as string;
		void router.push(`/organization/${orgId}/${nwid}`);
	};

	const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "Enter") {
			// Get the first row from filtered results
			const firstRow = table.getRowModel().rows[0];
			if (firstRow) {
				const nwid = firstRow.original.nwid;
				handleRowClick(nwid);
			}
		}
	};

	return (
		<div className="inline-block w-full p-1.5 align-middle">
			<div>
				<DebouncedInput
					ref={searchInputRef}
					value={globalFilter ?? ""}
					onChange={(value) => setGlobalFilter(String(value))}
					onKeyDown={handleSearchKeyDown}
					className="font-lg border-block border p-2 shadow"
					placeholder={t("commonTable.search.networkSearchPlaceholder")}
				/>
			</div>
			<div className="overflow-auto rounded-lg border border-base-200/50">
				<table className="min-w-full divide-y text-center">
					<thead className="">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<th
											key={header.id}
											colSpan={header.colSpan}
											className="bg-base-300/50 p-2 "
											style={{
												width: header.getSize() !== 150 ? header.getSize() : undefined,
											}}
										>
											{header.isPlaceholder ? null : (
												<div
													{...{
														className: header.column.getCanSort()
															? "cursor-pointer select-none"
															: "",
														onClick: header.column.getToggleSortingHandler(),
													}}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{{
														asc: " 🔼",
														desc: " 🔽",
													}[header.column.getIsSorted() as string] ?? null}
												</div>
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody className="divide-y">
						{table.getRowModel().rows.map((row) => {
							return (
								<tr
									key={row.id}
									// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
									onClick={() => handleRowClick(row?.original.nwid as string)}
									className="cursor-pointer border-base-300/50 hover:bg-primary/5"
								>
									{row.getVisibleCells().map((cell) => {
										return (
											<td key={cell.id} className="p-2">
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
				<div className="flex flex-col items-center justify-between py-3 sm:flex-row">
					<TableFooter table={table} page="centralNetworkTable" />
				</div>
			</div>
		</div>
	);
};
