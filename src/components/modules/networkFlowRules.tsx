import { toast } from "react-hot-toast";
import { api } from "~/utils/api";
import CodeMirror from "@uiw/react-codemirror";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { classname } from "@uiw/codemirror-extensions-classname";
import { python } from "@codemirror/lang-python";
import { useEffect, useState } from "react";
import { EditorView } from "@codemirror/view";
// import { useDebounce } from "usehooks-ts";
import { type CustomBackendError } from "~/types/errorHandling";
import { useRouter } from "next/router";

const initialErrorState = { error: null, line: null };
export const NetworkFlowRules = () => {
	const { query } = useRouter();
	// Local state to store changes to the flow route
	const {
		data: defaultFlowRoute,
		// isLoading,
		mutate: fetchFlowRoute,
	} = api.network.getFlowRule.useMutation();

	const [flowRoute, setFlowRoute] = useState(defaultFlowRoute);
	const [ruleError, setRuleError] = useState(initialErrorState);
	// const debouncedFlowRoute = useDebounce(flowRoute, 500);

	const { mutate: updateFlowRoute } = api.network.setFlowRule.useMutation({
		onSuccess: () => {
			void fetchFlowRoute({ nwid: query.id as string, reset: false });
			void toast.success("Flow rules updated successfully");
		},
		onError: ({ message }) => {
			try {
				const err = JSON.parse(message) as CustomBackendError;
				setRuleError({ error: err.error, line: err.line });
				void toast.error(err.error);
			} catch (error) {
				// eslint-disable-next-line no-console
				console.log(error);
			}
		},
	});

	// const debouncedUpdateFlowRoute = useCallback(() => {
	//   void updateFlowRoute({ flowRoute });
	//   // eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [debouncedFlowRoute]);
	useEffect(() => {
		setFlowRoute(defaultFlowRoute);
	}, [defaultFlowRoute]);
	useEffect(() => {
		fetchFlowRoute({
			nwid: query.id as string,
			reset: false,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	// Handle changes in CodeMirror
	const handleFlowRouteChange = (value: string) => {
		setFlowRoute(value);
		setRuleError(initialErrorState);
		// debouncedUpdateFlowRoute();
	};
	// Reset the flow route to the default value
	const handleReset = () => {
		setFlowRoute(defaultFlowRoute);
		void fetchFlowRoute({ nwid: query.id as string, reset: true });
		setRuleError(initialErrorState);
	};
	const classnameExt = classname({
		add: (lineNumber) => {
			if (lineNumber === ruleError.line) {
				return "first-line";
			}
		},
	});
	const errorColorTheme = EditorView.baseTheme({
		"&dark .first-line": { backgroundColor: "#AB2204" },
		"&light .first-line": { backgroundColor: "#AB2204" },
	});

	return (
		<div
			tabIndex={0}
			className="collapse-arrow collapse w-full border border-base-300 bg-base-200"
		>
			<input type="checkbox" />
			<div className="collapse-title">Flow Rules</div>
			<div className="collapse-content" style={{ width: "100%" }}>
				<CodeMirror
					tabIndex={0}
					value={flowRoute}
					onChange={handleFlowRouteChange}
					maxHeight="1500px"
					width="100%"
					theme={okaidia}
					extensions={[python(), errorColorTheme, classnameExt]}
					basicSetup={{
						lineNumbers: true,
						highlightActiveLineGutter: false,
						highlightActiveLine: false,
					}}
				/>
				<div className="space-x-4">
					<button
						onClick={() =>
							void updateFlowRoute({
								nwid: query.id as string,
								updateParams: {
									flowRoute: flowRoute || "#",
								},
							})
						}
						className="btn my-3 bg-base-300"
					>
						Save Changes
					</button>
					<button onClick={handleReset} className="btn btn-outline my-3 ">
						Reset
					</button>
				</div>
			</div>
		</div>
	);
};
