import { useState } from "react";
import Input from "~/components/elements/input";
import { api } from "~/utils/api";
import { getRandomColor } from "~/utils/randomColor";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import {
	useTrpcApiErrorHandler,
	useTrpcApiSuccessHandler,
} from "~/hooks/useTrpcApiHandler";

type IAnotationProps = {
	name: string;
};
type IProps = {
	nwid: string;
	nodeid: number;
	organizationId?: string;
};
const initalState: IAnotationProps = {
	name: "",
};

const Anotation = ({ nwid, nodeid, organizationId }: IProps) => {
	const t = useTranslations("networkById");

	const handleApiError = useTrpcApiErrorHandler();
	const handleApiSuccess = useTrpcApiSuccessHandler();

	const [input, setInput] = useState<IAnotationProps>(initalState);
	const { refetch: refetchNetworkById } = api.network.getNetworkById.useQuery(
		{
			nwid,
			central: false,
		},
		{ enabled: !!nwid, networkMode: "online" },
	);
	const { data: anotationArray, refetch: refetchAnotation } =
		api.network.getAnotation.useQuery(
			{
				nwid,
			},
			{
				enabled: !!nwid,
			},
		);
	const { data: memberAnotationArray, refetch: refetchMemberAnotation } =
		api.networkMember.getMemberAnotations.useQuery(
			{
				nwid,
				nodeid,
			},
			{
				enabled: !!nodeid && !!nwid,
			},
		);
	const { mutate: removeAnotation } =
		api.networkMember.removeMemberAnotations.useMutation({
			onError: handleApiError,
			onSuccess: handleApiSuccess({
				actions: [refetchMemberAnotation, refetchAnotation, refetchNetworkById],
			}),
		});

	const { mutate: setAnotation } = api.network.addAnotation.useMutation({
		onError: handleApiError,
		onSuccess: handleApiSuccess({
			actions: [refetchMemberAnotation, refetchAnotation, refetchNetworkById],
		}),
	});

	const inputHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;

		// Check if the value is in the datalist
		const isInList = filteredAnotations.some((anotation) => anotation.name === value);
		if (isInList) {
			if (!nodeid)
				return toast.error("Member does not exist in DB, please Authorize first");
			setAnotation(
				{
					name: value,
					organizationId,
					color: getRandomColor(),
					nwid,
					nodeid,
				},
				{
					onSuccess: () => {
						setInput({ name: "" });
					},
				},
			);
		} else {
			setInput((prev) => ({ ...prev, [name]: value }));
		}
	};

	// Filtering the notations based on the input text
	const filteredAnotations = anotationArray?.filter((anotation) =>
		anotation.name.toLowerCase().includes(input?.name.toLowerCase()),
	);

	return (
		<div className="space-y-3">
			{/* Header and Description */}
			<div>
				<h3 className="card-title text-base mb-1">
					{t("memberOptionModal.anotation.header")}
				</h3>
				<p className="text-xs text-base-content/70">
					{t("memberOptionModal.anotation.description")}
				</p>
			</div>

			{/* Input Form */}
			<form>
				<Input
					useTooltip
					type="text"
					className="input-bordered input-sm w-full"
					name="name"
					placeholder={t("memberOptionModal.anotation.placeholder")}
					value={input?.name || ""}
					onChange={inputHandler}
					list="anotation-list"
				/>
				<datalist id="anotation-list">
					{filteredAnotations?.map((anotation) => (
						<option key={anotation.name} value={anotation.name} />
					))}
				</datalist>
				<button
					onClick={(e) => {
						e.preventDefault();
						setAnotation(
							{
								name: input?.name,
								color: getRandomColor(),
								nwid,
								organizationId,
								nodeid,
							},
							{
								onSuccess: () => {
									void refetchMemberAnotation();
									void refetchAnotation();
									void refetchNetworkById();
									setInput({ name: "" });
								},
							},
						);
					}}
					type="submit"
					className="hidden"
				/>
			</form>

			{/* Current Annotations */}
			<div className="flex flex-wrap gap-1">
				{memberAnotationArray?.map((anotation) => (
					<div
						key={anotation.label.id}
						className={"badge rounded-md"}
						style={{ backgroundColor: `${anotation.label.color}` }}
					>
						<p className="text-xs">{anotation?.label?.name}</p>
						<div title="delete ip assignment">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth="1.5"
								stroke="currentColor"
								className="z-10 ml-2 h-3 w-3 cursor-pointer text-warning"
								onClick={() =>
									removeAnotation({
										organizationId,
										nodeid,
										notationId: anotation?.notationId,
									})
								}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
								/>
							</svg>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default Anotation;
