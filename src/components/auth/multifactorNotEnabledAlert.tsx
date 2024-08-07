import { useTranslations } from "next-intl";
import React from "react";

interface MultifactorNotEnabledProps {
	className?: string;
}

const MultifactorNotEnabled: React.FC<MultifactorNotEnabledProps> = ({
	className = "",
}) => {
	const t = useTranslations("userSettings");

	return (
		<div role="alert" className={`alert bg-primary/20 shadow-lg ${className}`}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				className="stroke-current h-6 w-6 shrink-0"
				aria-hidden="true"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
			<div>
				<h3 className="font-bold">{t("account.totp.notification.title")}</h3>
				<div className="text-sm">{t("account.totp.notification.description")}</div>
			</div>
		</div>
	);
};

export default MultifactorNotEnabled;
