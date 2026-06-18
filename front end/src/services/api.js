const API_BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export async function sendInsuranceChat(messages) {
	try {
		const response = await fetch(`${API_BASE_URL}/insurance-chat`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ messages }),
		});

		const data = await response.json();

		if (!response.ok) {
			return {
				error: data.error || "Something went wrong.",
				success: false,
			};
		}

		return data;
	} catch (err) {
		console.error("API call failed:", err);
		return {
			error: "Could not connect to Tina. Make sure the backend API is running.",
			success: false,
		};
	}
}
