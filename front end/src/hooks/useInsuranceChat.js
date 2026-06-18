import { useMemo, useState } from "react";
import { sendInsuranceChat } from "../services/api.js";

const openingMessage = {
	role: "assistant",
	content:
		"I'm Tina. I help you choose the right insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?",
};

export function useInsuranceChat() {
	const [messages, setMessages] = useState([openingMessage]);
	const [draft, setDraft] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const canSend = useMemo(() => draft.trim().length > 0 && !loading, [draft, loading]);

	const sendMessage = async (event) => {
		event.preventDefault();

		const content = draft.trim();
		if (!content || loading) {
			return;
		}

		const nextMessages = [...messages, { role: "user", content }];
		setMessages(nextMessages);
		setDraft("");
		setError("");
		setLoading(true);

		const data = await sendInsuranceChat(nextMessages);

		if (data.error) {
			setError(data.error);
		} else {
			setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
		}

		setLoading(false);
	};

	const resetChat = () => {
		setMessages([openingMessage]);
		setDraft("");
		setError("");
		setLoading(false);
	};

	return {
		messages,
		draft,
		loading,
		error,
		canSend,
		setDraft,
		sendMessage,
		resetChat,
	};
}
