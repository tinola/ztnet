import { useTranslations } from "next-intl";
import React, { ChangeEvent, useMemo } from "react";
import { useState, useRef, useEffect } from "react";
import Input from "~/components/elements/input";
import cn from "classnames";
import MultiSelectDropdown from "./multiSelect";
import Verified from "~/icons/verified";

interface FieldConfig {
	name: string;
	description?: string;
	title?: string;
	initialValue?: string;
	type?: string;
	placeholder?: string;
	displayValue?: string;
	defaultValue?: string | number | boolean;
	value?: string | number | boolean;
	elementType?: "input" | "select" | "textarea" | "dropdown";
	selectOptions?: string[] | { value: string; label: string }[];
	min?: string; // For date inputs to set minimum selectable date
}

type SubmitHandlerType = (
	values: Record<string, string | boolean | string[]>,
) => Promise<unknown>;

interface FormProps {
	label: string;
	labelClassName?: string;
	isLoading?: boolean;
	placeholder?: string;
	disabled?: boolean;
	description?: string;
	fields: FieldConfig[];
	size?: "xs" | "sm" | "md" | "lg";
	buttonClassName?: string;
	rootClassName?: string;
	rootFormClassName?: string;
	labelStyle?: string;
	buttonText?: string;
	openByDefault?: boolean;
	showSubmitButtons?: boolean;
	showCancelButton?: boolean;
	submitHandler: SubmitHandlerType;
	badge?: {
		text: string;
		color: string;
		onClick?: () => void;
	};
	headerBadge?: {
		text: string;
		color: string;
		onClick?: () => void;
	};
	toolTip?: {
		text: string;
		className?: string;
		isVerified?: boolean;
		onClick?: () => void;
	};
}

const InputField = ({
	label,
	labelClassName,
	disabled,
	placeholder,
	description,
	fields,
	submitHandler,
	badge,
	headerBadge,
	toolTip,
	isLoading,
	size = "md",
	buttonClassName,
	rootClassName,
	rootFormClassName,
	labelStyle,
	buttonText,
	openByDefault = false,
	showSubmitButtons = true,
	showCancelButton = true,
}: FormProps) => {
	const t = useTranslations("commonButtons");
	const [showInputs, setShowInputs] = useState(openByDefault);
	const [formValues, setFormValues] = useState<
		Record<string, string | boolean | string[]>
	>({});

	// Create a new ref
	const inputRef = useRef<HTMLInputElement>(null);
	const selectRef = useRef<HTMLSelectElement>(null);

	// Extract primitive values from fields
	const fieldsDependency = useMemo(() => {
		return fields
			.map((field) => `${field.name}:${field.type}:${field.value}:${field.initialValue}`)
			.join("|");
	}, [fields]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <extracting fieldsDependency to get the primitive types used for useEffect.>
	useEffect(() => {
		setFormValues(
			fields.reduce(
				(acc, field) => {
					let value: string | number | boolean | string[];
					if (field.type === "checkbox") {
						value = !!field.value || !!field.initialValue;
					} else {
						value = field.value || field.initialValue || "";
					}
					acc[field.name] = typeof value === "number" ? String(value) : value;
					return acc;
				},
				{} as Record<string, string | boolean | string[]>,
			),
		);
	}, [fieldsDependency]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <extracting fieldsDependency to get the primitive types used for useEffect.>
	useEffect(() => {
		// When showInputs is true, focus the appropriate field based on its type
		if (showInputs) {
			if (fields[0].type === "select") {
				selectRef.current?.focus();
			} else {
				inputRef.current?.focus();
			}
		}
	}, [showInputs, fieldsDependency]);

	const handleEditClick = () => !disabled && setShowInputs(!showInputs);

	const handleChange = (
		e:
			| ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
			| { target: { name: string; value: string | string[] } },
	) => {
		const { name, value } = "target" in e ? e.target : e;
		setFormValues((prevValues) => ({
			...prevValues,
			[name]: value,
		}));
	};

	const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, checked } = e.target;
		setFormValues((prevValues) => ({
			...prevValues,
			[name]: checked,
		}));
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const response = await submitHandler(formValues);
		if (response && !openByDefault) {
			setShowInputs(false);
		}
	};

	const renderLoading = () => (
		<div className="mt-1 text-sm">
			<span className="loading loading-dots loading-md"></span>
		</div>
	);

	const renderBadge = (badgeProps: FormProps["badge"] | FormProps["headerBadge"]) => {
		if (!badgeProps) return null;

		return (
			<span
				className={`badge badge-outline badge-${badgeProps.color} sm:ml-2 ${
					badgeProps.onClick ? "cursor-pointer" : ""
				}`}
				onClick={(e) => {
					e.stopPropagation();
					if (badgeProps.onClick) {
						badgeProps.onClick();
					}
				}}
			>
				{badgeProps.text}
			</span>
		);
	};

	const renderToolTip = (toolTip: FormProps["toolTip"]) => {
		if (!toolTip) return null;

		return (
			<div
				className={cn("tooltip tooltip-right", toolTip.className)}
				data-tip={toolTip.text}
			>
				<button
					className="btn btn-circle btn-ghost btn-xs"
					onClick={(e) => {
						e.stopPropagation();
						if (toolTip.onClick) {
							toolTip.onClick();
						}
					}}
				>
					{toolTip.isVerified ? (
						<Verified />
					) : (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							className="w-4 h-4 stroke-current text-primary"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
					)}
				</button>
			</div>
		);
	};
	return (
		<>
			{!showInputs ? (
				<div className="flex w-full justify-between">
					<div onClick={handleEditClick} className={`cursor-pointer ${labelStyle}`}>
						<div className="flex font-medium items-center">
							<span>{label}</span>
							{renderBadge(headerBadge)}
						</div>
						<div>
							{description ? (
								<p className="m-0 p-0 text-xs text-gray-500">{description}</p>
							) : null}
						</div>
						<div className="sm:flex items-center text-gray-500">
							<span>{placeholder ?? fields[0].placeholder}</span>
							{renderBadge(badge)}
							{renderToolTip(toolTip)}
						</div>
					</div>
					<div>
						<button
							data-testid="view-form"
							disabled={disabled}
							onClick={handleEditClick}
							className={cn(`btn btn-${size}`, { hidden: !showSubmitButtons })}
						>
							{buttonText || t("change")}
						</button>
					</div>
				</div>
			) : (
				<form
					onSubmit={(event) => {
						void handleSubmit(event);
					}}
					className={`flex ${rootClassName}`}
				>
					<div className="flex-1">
						<div className="flex font-medium">
							<span>{label}</span>

							{headerBadge && (
								<span className={`badge badge-outline badge-${headerBadge.color} ml-2`}>
									{headerBadge.text}
								</span>
							)}
						</div>
						<div>
							{description ? (
								<p className="m-0 p-0 text-xs text-gray-500">{description}</p>
							) : null}
						</div>
						<div className={rootFormClassName}>
							{fields.map((field, i) => {
								if (field.type === "checkbox") {
									return (
										<div key={field.name} className="form-control">
											{field.title ? (
												<label className={`text-sm text-gray-500 pt-2 ${labelClassName}`}>
													{field.title}
												</label>
											) : null}
											{field.description ? (
												<label className={`text-sm text-gray-500 pt-2 ${labelClassName}`}>
													{field.description}
												</label>
											) : null}
											<label className="label cursor-pointer">
												<input
													ref={i === 0 ? inputRef : undefined}
													type="checkbox"
													name={field.name}
													checked={!!formValues[field.name]}
													onChange={handleCheckboxChange}
													className="checkbox checkbox-primary checkbox-sm"
												/>
												<span>{field.placeholder}</span>
											</label>
										</div>
									);
								}
								if (field.elementType === "dropdown" && field.selectOptions) {
									return (
										<div key={field.name} className="form-control w-full">
											{field.title ? (
												<label className={`text-sm text-gray-500 pt-2 ${labelClassName}`}>
													{field.title}
												</label>
											) : null}
											{field.description ? (
												<label className={`text-sm text-gray-500 pt-2 ${labelClassName}`}>
													{field.description}
												</label>
											) : null}
											<MultiSelectDropdown
												formFieldName={field.name}
												options={field.selectOptions as string[]}
												value={(formValues[field.name] as string[]) || []}
												onChange={(selectedValues: string[]) =>
													handleChange({
														target: { name: field.name, value: selectedValues },
													})
												}
												prompt={field.placeholder}
											/>
										</div>
									);
								}
								if (field.elementType === "select" && field.selectOptions) {
									return (
										<div key={field.name} className="form-control">
											{field.title ? (
												<label className={`text-sm text-gray-500 pt-2 ${labelClassName}`}>
													{field.title}
												</label>
											) : null}
											{field.description ? (
												<label className={`text-sm text-gray-500 pt-2 ${labelClassName}`}>
													{field.description}
												</label>
											) : null}
											<select
												ref={i === 0 ? selectRef : undefined}
												value={String(formValues[field.name])}
												onChange={handleChange}
												name={field.name}
												className={`select select-bordered select-${size}`}
											>
												{Array.isArray(field.selectOptions)
													? field.selectOptions.map((option) => (
															<option value={option?.value} key={option.value}>
																{option.label}
															</option>
														))
													: null}
											</select>
										</div>
									);
								}

								if (field.elementType === "textarea") {
									return (
										<div key={field.name} className="form-control">
											{field.title ? (
												<label className={`text-sm text-gray-500 pt-2 ${labelClassName}`}>
													{field.title}
												</label>
											) : null}
											{field.description ? (
												<label className={`text-sm text-gray-500 pt-2 ${labelClassName}`}>
													{field.description}
												</label>
											) : null}
											<textarea
												value={
													String(formValues[field.name]).replace(/<br \/>/g, "\n") || ""
												}
												className="custom-scrollbar textarea textarea-bordered border-2 font-medium leading-snug focus:outline-none"
												placeholder={field.placeholder}
												rows={5}
												name={field.name}
												onChange={handleChange}
											/>
										</div>
									);
								}
								return (
									<div key={field.name} className="form-control">
										{field.description ? (
											<label className={`text-sm text-gray-500 ${labelClassName}`}>
												{field.description}
											</label>
										) : null}
										<Input
											ref={i === 0 ? inputRef : undefined}
											type={field.type}
											key={field.name}
											placeholder={field.placeholder}
											value={String(formValues[field.name])}
											onChange={handleChange}
											name={field.name}
											className={`input-bordered input-${size} w-full`}
											min={field.min}
										/>
									</div>
								);
							})}
						</div>
					</div>
					<div className={cn("flex gap-3 justify-end", { hidden: !showSubmitButtons })}>
						<button
							disabled={isLoading}
							className={`btn btn-primary btn-${size} ${buttonClassName}`}
							type="submit"
						>
							{isLoading ? renderLoading() : t("submit")}
						</button>
						<button
							className={cn(`btn btn-${size} ${buttonClassName}`, {
								hidden: !showCancelButton,
							})}
							onClick={(e) => {
								e.preventDefault();
								handleEditClick();
							}}
						>
							{t("cancel")}
						</button>
					</div>
				</form>
			)}
		</>
	);
};

export default InputField;
