import React from "react";

interface CardProps {
	title: string;
	content: string;
	rootClassName: string;
	iconClassName: string;
	faded: boolean;
	onClick: () => void;
}

const PrivatePublicCard: React.FC<CardProps> = ({
	onClick,
	title,
	content,
	rootClassName,
	iconClassName,
	faded,
}) => {
	return (
		<div
			onClick={onClick}
			className={`${faded ? "opacity-25" : "opacity-100"} ${rootClassName}`}
		>
			<div className="p-4">
				<div className="flex items-center justify-between">
					<span>{title}</span>
					<span className={`${faded ? "hidden" : "block"}`}>
						{/* <CheckCircleOutlineIcon className={`text-${color}-500`} /> */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth="1.5"
							stroke="currentColor"
							className={`h-6 w-6 ${iconClassName}`}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
							/>
						</svg>
					</span>
				</div>
				<div className="text-sm">
					<small>{content}</small>
				</div>
			</div>
		</div>
	);
};

export default PrivatePublicCard;
