import cn from "classnames";
import { useCallback, useRef } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { useModalStore } from "~/utils/store";
import { useTranslations } from "next-intl";

const Modal = () => {
	const t = useTranslations("commonButtons");
	const ref = useRef(null);
	// Select only the necessary state
	const isOpen = useModalStore((state) => state.isOpen);
	const description = useModalStore((state) => state.description);
	const content = useModalStore((state) => state.content);
	const title = useModalStore((state) => state.title);
	const rootStyle = useModalStore((state) => state.rootStyle);
	const showButtons = useModalStore((state) => state.showButtons);
	const yesAction = useModalStore((state) => state.yesAction);
	const disableClickOutside = useModalStore((state) => state.disableClickOutside);

	// Use separate selectors for actions to prevent unnecessary re-renders
	const toggleModal = useModalStore(useCallback((state) => state.toggleModal, []));
	const closeModal = useModalStore(useCallback((state) => state.closeModal, []));

	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	useOnClickOutside(ref, () => {
		if (!disableClickOutside) {
			closeModal();
		}
	});

	const actionHandler = () => {
		yesAction?.();
		toggleModal();
	};

	const modalClass = cn({
		"modal transition-none z-20": true,
		"modal-open": isOpen,
	});

	return (
		<dialog className={modalClass}>
			<div
				className={cn("custom-scrollbar modal-box relative bg-base-100", rootStyle)}
				ref={ref}
			>
				<h3 className="text-lg font-bold">{title}</h3>
				{description ? <p className="py-4">{description}</p> : null}
				<div>{content}</div>
				{showButtons ? (
					<div className="modal-action">
						{yesAction ? (
							<>
								{/* closes the modal */}
								<button className="btn" onClick={actionHandler}>
									{t("yes")}
								</button>
								<button className="btn" onClick={closeModal}>
									{t("cancel")}
								</button>
							</>
						) : (
							<button className="btn" onClick={closeModal}>
								{t("close")}
							</button>
						)}
					</div>
				) : null}
			</div>
		</dialog>
	);
};

export default Modal;
