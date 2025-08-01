import { useMemo } from "react";
import { MemberOptionsModal } from "../../networkByIdPage/memberOptionsModal";
import { api } from "~/utils/api";
import { useModalStore } from "~/utils/store";
import { useTranslations } from "next-intl";
import TimeAgo from "react-timeago";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { type NetworkMemberNotation, type MemberEntity } from "~/types/local/member";
import {
	useTrpcApiErrorHandler,
	useTrpcApiSuccessHandler,
} from "~/hooks/useTrpcApiHandler";
import cn from "classnames";
import {
	sortingIpAddress,
	sortingMemberHex,
	sortingPhysicalIpAddress,
} from "~/utils/sorting";

enum ConnectionStatus {
	Offline = 0,
	Relayed = 1,
	DirectLAN = 2,
	DirectWAN = 3,
	Controller = 4,
}

interface IProp {
	nwid: string;
	central: boolean;
	organizationId?: string;
}

export const MemberHeaderColumns = ({ nwid, central = false, organizationId }: IProp) => {
	const b = useTranslations("commonButtons");
	const c = useTranslations("commonTable");
	const t = useTranslations();

	const handleApiError = useTrpcApiErrorHandler();
	const handleApiSuccess = useTrpcApiSuccessHandler();

	const callModal = useModalStore((state) => state.callModal);
	const utils = api.useUtils();
	const { data: me } = api.auth.me.useQuery();
	const { data: networkById, refetch: refetchNetworkById } =
		api.network.getNetworkById.useQuery(
			{
				nwid,
				central,
			},
			{ enabled: !!nwid },
		);
	const { mutate: stashUser } = api.networkMember.stash.useMutation({
		onSuccess: async () => {
			await utils.network.getNetworkById.invalidate({ nwid, central });
			refetchNetworkById();
		},
	});
	const { mutate: deleteMember } = api.networkMember.delete.useMutation({
		onSuccess: async () => {
			await utils.network.getNetworkById.invalidate({ nwid, central });
			refetchNetworkById();
		},
	});
	const { mutate: updateMember } = api.networkMember.Update.useMutation({
		onError: handleApiError,
		onSuccess: async () => {
			await utils.network.getNetworkById.invalidate({ nwid, central });
			handleApiSuccess({ actions: [refetchNetworkById] })();
		},
	});

	const columnHelper = createColumnHelper<MemberEntity>();
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	const columns = useMemo<ColumnDef<MemberEntity>[]>(
		() => [
			columnHelper.accessor(
				(row) => {
					// biome-ignore lint/suspicious/noExplicitAny: <explanation>
					const notations = (row as any)?.notations as NetworkMemberNotation[];
					const output: string[] = [];
					notations?.map((tag) => {
						return output.push(tag?.label?.name);
					});

					return output.join(", ");
				},
				{
					header: () => "Notations",
					id: "notations",
				},
			),
			columnHelper.accessor("authorized", {
				header: () => <span>{c("header.authorized")}</span>,
				id: "authorized",
				cell: ({ getValue, row: { original } }) => {
					// const options = [
					// 	original?.activeBridge ? (
					// 		<span className="text-sm text-primary tracking-tighter">
					// 			<Br />
					// 		</span>
					// 	) : null,
					// 	original?.noAutoAssignIps ? <Aa /> : null,
					// ]
					// 	.filter(Boolean)
					// 	.reduce(
					// 		(acc, elem, index) => (
					// 			<>
					// 				{acc}
					// 				{index > 0 ? "" : ""}
					// 				{elem}
					// 			</>
					// 		),
					// 		null,
					// 	);
					return (
						<span className="flex items-center justify-center gap-2">
							<label className="label cursor-pointer justify-center">
								{/* add a letter B if bridge has been enabled */}

								<input
									type="checkbox"
									checked={getValue()}
									onChange={(event) => {
										const authorized = event.target.checked;
										if (me?.options?.deAuthorizeWarning && !authorized) {
											callModal({
												title: "Warning",
												description: "Are you sure you want to deauthorize this member?",
												yesAction: () => {
													updateMember(
														{
															nwid,
															memberId: original.id,
															central,
															organizationId,
															updateParams: { authorized },
														},
														{ onSuccess: () => void refetchNetworkById() },
													);
												},
											});
										} else {
											updateMember(
												{
													nwid,
													memberId: original.id,
													central,
													organizationId,
													updateParams: { authorized: event.target.checked },
												},
												{ onSuccess: () => void refetchNetworkById() },
											);
										}
									}}
									className="checkbox-success checkbox checkbox-xs sm:checkbox-sm"
								/>
							</label>
							{/* {options} */}
						</span>
					);
				},
			}),
			columnHelper.accessor("name", {
				header: () => <span>{c("header.name")}</span>,
				meta: {
					style: {
						textAlign: "left",
					},
				},
				id: "name",
			}),
			columnHelper.accessor("description", {
				header: () => <span>{c("header.description")}</span>,
				meta: {
					style: {
						textAlign: "left",
					},
				},
				id: "description",
			}),
			columnHelper.accessor("id", {
				header: () => <span>{c("header.id")}</span>,
				id: "id",
				sortingFn: sortingMemberHex,
				cell: (info) => <span className="text-sm">{info.getValue()}</span>,
			}),
			columnHelper.accessor("ipAssignments", {
				header: () => <span>{c("header.ipAssignments.header")}</span>,
				meta: {
					style: {
						textAlign: "left",
					},
				},
				id: "ipAssignments",
				sortingFn: sortingIpAddress,
			}),
			// columnHelper.accessor("creationTime", {
			// 	header: () => <span>{c("header.created")}</span>,
			// 	id: "creationTime",
			// 	cell: (info) => {
			// 		const createdDate = new Date(info.getValue());
			// 		const formatTime = (value: string, unit: string) => {
			// 			// Map full unit names to their abbreviations
			// 			const unitAbbreviations: { [key: string]: string } = {
			// 				second: "sec ago",
			// 				minute: "min ago",
			// 				hour: "hours ago",
			// 				day: "days ago",
			// 				week: "weeks ago",
			// 				month: "months ago",
			// 				year: "years ago",
			// 			};
			// 			const abbreviation = unitAbbreviations[unit] || unit;

			// 			return `${value} ${abbreviation}`;
			// 		};
			// 		return (
			// 			<TimeAgo date={createdDate} formatter={formatTime} title={createdDate} />
			// 		);
			// 	},
			// }),
			columnHelper.accessor(
				(row) => {
					return row?.physicalAddress;
				},
				{
					header: () => <span>{c("header.physicalIp.header")}</span>,
					sortDescFirst: true,
					id: "physicalAddress",
					sortUndefined: -1,
					sortingFn: sortingPhysicalIpAddress,
					cell: ({ getValue, row: { original } }) => {
						const isOffline = original?.conStatus === ConnectionStatus.Offline;
						if (central) {
							const centralPhysicalAddress: string = original?.physicalAddress;
							if (!centralPhysicalAddress || typeof centralPhysicalAddress !== "string")
								return (
									<span className="text-gray-400/50 text-sm">
										{c("header.physicalIp.unknownValue")}
									</span>
								);

							return (
								<span className="text-sm">{centralPhysicalAddress.split("/")[0]}</span>
							);
						}
						const physicalAddress = getValue();
						if (!physicalAddress || typeof physicalAddress !== "string")
							return (
								<span className="text-gray-400/50 text-sm">
									{c("header.physicalIp.unknownValue")}
								</span>
							);

						return (
							<div>
								{isOffline ? (
									<span className="text-sm text-gray-400/50">
										{physicalAddress.split("/")[0]}
									</span>
								) : (
									<span className="text-sm">{physicalAddress.split("/")[0]}</span>
								)}
							</div>
						);
					},
				},
			),
			columnHelper.accessor("conStatus", {
				header: () => <span>{c("header.conStatus.header")}</span>,
				id: "conStatus",
				cell: ({ row: { original } }) => {
					const lastSeen = new Date(original?.lastSeen);

					const formatTime = (value: string, unit: string) => {
						// Map full unit names to their abbreviations
						const unitAbbreviations: { [key: string]: string } = {
							second: "sec",
							minute: "min",
							hour: "hour",
							day: "day",
							week: "week",
							month: "month",
							year: "year",
						};
						const abbreviation = unitAbbreviations[unit] || unit;
						return `${value} ${abbreviation}`;
					};
					const cursorStyle = { cursor: "pointer" };

					if (central) {
						// assuming lastSeen is a timestamp in milliseconds
						const now = Date.now(); // current timestamp in milliseconds
						const fiveMinutesAgo = now - 5 * 60 * 1000; // timestamp 5 minutes ago
						// Check if lastSeen is within the last 5 minutes
						if (lastSeen.getTime() >= fiveMinutesAgo) {
							// The user is considered online
							return (
								<span
									style={cursorStyle}
									className="text-success text-sm" // Change the className to whatever you use for positive/online statuses
									title="User is online"
								>
									ONLINE
								</span>
							);
						}
						// The user is considered offline
						return (
							<span
								style={cursorStyle}
								className="text-error text-sm"
								title="User is offline"
							>
								<span>{c("header.conStatus.offline")}</span>
								<span>
									<TimeAgo date={lastSeen} formatter={formatTime} title={lastSeen} />
								</span>
							</span>
						);
					}
					if (original.conStatus === ConnectionStatus.Controller) {
						return (
							<span
								style={cursorStyle}
								className="cursor-pointer text-warning text-sm"
								title="Controller"
							>
								CONTROLLER
							</span>
						);
					}
					if (original.conStatus === ConnectionStatus.Relayed) {
						return (
							<span
								style={cursorStyle}
								className="cursor-pointer text-warning text-sm"
								title={c("header.conStatus.toolTip")}
							>
								{c("header.conStatus.relayed")}
							</span>
						);
					}

					if (
						original.conStatus === ConnectionStatus.DirectLAN ||
						original.conStatus === ConnectionStatus.DirectWAN
					) {
						const directTitle =
							original.conStatus === ConnectionStatus.DirectLAN
								? c("header.conStatus.directLan")
								: c("header.conStatus.directWan");
						const versionInfo =
							original.peers?.version && original.peers.version !== "-1.-1.-1"
								? ` (v${original.peers.version})`
								: "";

						return (
							<div
								style={cursorStyle}
								className="text-success text-sm"
								title={directTitle}
							>
								{c("header.conStatus.direct", {
									version: versionInfo,
								})}{" "}
							</div>
						);
					}

					return (
						<span
							style={cursorStyle}
							className="text-error space-x-1 text-sm"
							title="User is offline"
						>
							<span>{c("header.conStatus.offline")}</span>
							<span>
								<TimeAgo date={lastSeen} formatter={formatTime} title={lastSeen} />
							</span>
						</span>
					);
				},
			}),
			columnHelper.accessor("action", {
				header: () => <span>{c("header.actions")}</span>,
				id: "action",
				enableSorting: false,
				cell: ({ row: { original } }) => {
					return (
						<div className="space-x-2">
							<button
								onClick={() =>
									callModal({
										title: (
											<p>
												{t("networkById.networkMembersTable.optionModalTitle")}{" "}
												<span className="text-primary">{`${
													original.name ? original.name : original.id
												}`}</span>
											</p>
										),
										rootStyle: "text-left max-w-4xl w-full",
										content: (
											<MemberOptionsModal
												nwid={original.nwid}
												memberId={original.id}
												central={central}
												organizationId={organizationId}
											/>
										),
									})
								}
								className="btn btn-outline btn-xs rounded-sm"
							>
								{b("options")}
							</button>
							{central ? (
								<button
									onClick={() =>
										deleteMember({
											central,
											id: original.id,
											nwid: original.nwid,
											organizationId,
										})
									}
									className="btn btn-error btn-outline btn-xs rounded-sm"
								>
									{b("delete")}
								</button>
							) : (
								<button
									onClick={() =>
										stashUser(
											{
												nwid,
												id: original.id,
												organizationId,
											},
											{ onSuccess: () => void refetchNetworkById() },
										)
									}
									className={cn("btn btn-outline btn-xs rounded-sm", {
										"btn-warning": !central,
										"btn-error": central,
									})}
								>
									{b("stash")}
								</button>
							)}
						</div>
					);
				},
			}),
		],
		// this is needed so the ip in table is updated accordingly
		[networkById?.network],
	);

	return columns;
};
