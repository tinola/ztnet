import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { NextApiResponse } from "next";
import toast from "react-hot-toast";
import { ZodError } from "zod";
import { ErrorData } from "~/types/errorHandling";

interface FieldErrors {
	[field: string]: string[];
}

function handleZodError(error: ZodError, res: NextApiResponse) {
	const fieldErrors = error.issues.reduce<FieldErrors>((acc, issue) => {
		const path = issue.path.join(".");
		if (!acc[path]) {
			acc[path] = [];
		}
		acc[path].push(issue.message);
		return acc;
	}, {});

	return res.status(400).json({
		error: {
			message: "Validation error",
			fieldErrors,
		},
	});
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const handleErrors = (error: any) => {
	if ((error.data as ErrorData)?.zodError) {
		const fieldErrors = (error.data as ErrorData)?.zodError.fieldErrors;
		for (const field in fieldErrors) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-call
			toast.error(`${fieldErrors[field].join(", ")}`);
		}
	} else if (error.message) {
		toast.error(error.message);
	} else {
		toast.error("An unknown error occurred");
	}
};

export const handleApiErrors = (cause, res: NextApiResponse) => {
	// check if cause is an zod error
	if (cause instanceof ZodError) {
		return handleZodError(cause, res);
	}

	if (cause instanceof TRPCError) {
		const httpCode = getHTTPStatusCodeFromError(cause);
		try {
			const parsedErrors = JSON.parse(cause.message);
			return res.status(httpCode).json({ cause: parsedErrors });
		} catch (_error) {
			return res.status(httpCode).json({ error: cause.message });
		}
	}

	// Check if the error is an instance of Error and has a message indicating an invalid token
	if (cause instanceof Error && cause.message === "Invalid token") {
		return res.status(401).json({ error: "Invalid token" });
	}

	if (cause instanceof Error) {
		return res.status(500).json({ message: cause.message });
	}
	return res.status(500).json({ message: "Internal server error" });
};
