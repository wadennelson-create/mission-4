import { Mic, MicOff, RotateCcw, Send, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInsuranceChat } from "./hooks/useInsuranceChat.js";
import "./App.css";

const voiceProfiles = [
	{ id: "normal", label: "Tina", pitch: 1.12, rate: 1 },
	{ id: "bright", label: "Bright", pitch: 1.24, rate: 1.05 },
	{ id: "calm", label: "Calm", pitch: 0.9, rate: 0.88 },
	{ id: "cinema", label: "Cinema", pitch: 0.72, rate: 0.82 },
];

const preferredFemaleVoiceNames = [
	"samantha",
	"zira",
	"susan",
	"hazel",
	"heera",
	"aria",
	"jenny",
	"natasha",
	"sonia",
	"female",
	"google uk english female",
	"google us english",
];

function chooseTinaVoice(voices) {
	const englishVoices = voices.filter((voice) =>
		voice.lang?.toLowerCase().startsWith("en"),
	);
	const voicePool = englishVoices.length > 0 ? englishVoices : voices;

	return (
		voicePool.find((voice) =>
			preferredFemaleVoiceNames.some((name) =>
				voice.name.toLowerCase().includes(name),
			),
		) ??
		voicePool.find((voice) => voice.lang?.toLowerCase() === "en-nz") ??
		voicePool.find((voice) => voice.lang?.toLowerCase() === "en-au") ??
		voicePool[0] ??
		null
	);
}

function App() {
	const {
		messages,
		draft,
		loading,
		error,
		canSend,
		setDraft,
		sendMessage,
		resetChat,
	} = useInsuranceChat();
	const [speechEnabled, setSpeechEnabled] = useState(true);
	const [voiceProfileId, setVoiceProfileId] = useState("normal");
	const [listening, setListening] = useState(false);
	const [voiceNotice, setVoiceNotice] = useState("");
	const recognitionRef = useRef(null);
	const lastSpokenRef = useRef("");

	const voiceProfile = useMemo(
		() =>
			voiceProfiles.find((profile) => profile.id === voiceProfileId) ??
			voiceProfiles[0],
		[voiceProfileId],
	);

	const supportsSpeech = typeof window !== "undefined" && "speechSynthesis" in window;
	const SpeechRecognition =
		typeof window !== "undefined" &&
		(window.SpeechRecognition || window.webkitSpeechRecognition);
	const supportsListening = Boolean(SpeechRecognition);

	const speak = (text) => {
		if (!supportsSpeech || !text) {
			return;
		}

		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		const voices = window.speechSynthesis.getVoices();
		utterance.voice = chooseTinaVoice(voices);
		utterance.pitch = voiceProfile.pitch;
		utterance.rate = voiceProfile.rate;
		window.speechSynthesis.speak(utterance);
	};

	useEffect(() => {
		if (!supportsSpeech || !speechEnabled) {
			return;
		}

		const latestAssistantMessage = [...messages]
			.reverse()
			.find((message) => message.role === "assistant");

		if (
			latestAssistantMessage &&
			latestAssistantMessage.content !== lastSpokenRef.current
		) {
			lastSpokenRef.current = latestAssistantMessage.content;
			speak(latestAssistantMessage.content);
		}
	}, [messages, speechEnabled, supportsSpeech, voiceProfile]);

	useEffect(() => {
		return () => {
			recognitionRef.current?.stop();
			if (supportsSpeech) {
				window.speechSynthesis.cancel();
			}
		};
	}, [supportsSpeech]);

	const handleReplyKeyDown = (event) => {
		if (event.key === "Enter" && !event.shiftKey) {
			sendMessage(event);
		}
	};

	const startListening = () => {
		if (!supportsListening || listening) {
			setVoiceNotice("Voice input is not available in this browser.");
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = "en-NZ";
		recognition.continuous = false;
		recognition.interimResults = true;

		recognition.onstart = () => {
			setListening(true);
			setVoiceNotice("");
		};

		recognition.onresult = (event) => {
			const transcript = Array.from(event.results)
				.map((result) => result[0]?.transcript ?? "")
				.join("")
				.trim();
			setDraft(transcript);
		};

		recognition.onerror = () => {
			setVoiceNotice("I could not hear that clearly.");
			setListening(false);
		};

		recognition.onend = () => {
			setListening(false);
		};

		recognitionRef.current = recognition;
		recognition.start();
	};

	const stopListening = () => {
		recognitionRef.current?.stop();
		setListening(false);
	};

	const toggleSpeech = () => {
		if (speechEnabled && supportsSpeech) {
			window.speechSynthesis.cancel();
		}
		setSpeechEnabled((enabled) => !enabled);
	};

	const handleReset = () => {
		if (supportsSpeech) {
			window.speechSynthesis.cancel();
		}
		lastSpokenRef.current = "";
		resetChat();
	};

	return (
		<main className="app-shell">
			<div className="hazard-sky" aria-hidden="true">
				<span className="lightning lightning-one" />
				<span className="lightning lightning-two" />
				<span className="meteor" />
				<span className="impact-glow" />
				<span className="volcano" />
				<span className="eruption eruption-one" />
				<span className="eruption eruption-two" />
				<span className="lava-flow lava-flow-one" />
				<span className="lava-flow lava-flow-two" />
			</div>
			<section
				className={`workbench ${listening ? "is-listening" : ""}`}
				aria-label="Turners insurance recommendation chat"
			>
				<div className="chat-column">
					<header className="topbar">
						<div className="title-lockup">
							<div className="assistant-mark" aria-hidden="true">
								T
							</div>
							<div>
								<p className="eyebrow">Turners insurance assistant</p>
								<h1>Tina</h1>
							</div>
						</div>
						<div className="topbar-actions">
							<label className="voice-select">
								<span>Voice</span>
								<select
									value={voiceProfileId}
									onChange={(event) => setVoiceProfileId(event.target.value)}
								>
									{voiceProfiles.map((profile) => (
										<option key={profile.id} value={profile.id}>
											{profile.label}
										</option>
									))}
								</select>
							</label>
							<button
								className="icon-button"
								type="button"
								onClick={toggleSpeech}
								title={speechEnabled ? "Turn voice off" : "Turn voice on"}
								aria-label={speechEnabled ? "Turn voice off" : "Turn voice on"}
							>
								{speechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
							</button>
							<button
								className="icon-button"
								type="button"
								onClick={handleReset}
								title="New chat"
								aria-label="New chat"
							>
								<RotateCcw size={20} />
							</button>
						</div>
					</header>

					<div
						className="transcript"
						aria-live="polite"
						aria-label="Chat transcript"
					>
						<div className="transcript-hazards" aria-hidden="true">
							<span className="hazard-bolt hazard-bolt-one" />
							<span className="hazard-bolt hazard-bolt-two" />
							<span className="hazard-meteor" />
							<span className="hazard-crack" />
							<span className="hazard-warning">Hazard zone</span>
						</div>
						<div className="signal-strip" aria-hidden="true">
							<span />
							<span />
							<span />
							<strong>{listening ? "Listening" : loading ? "Thinking" : "Ready"}</strong>
						</div>
						{messages.map((message, index) => (
							<article
								className={`message ${message.role}`}
								key={`${message.role}-${index}`}
							>
								<div className="message-meta">
									<span>{message.role === "assistant" ? "Tina" : "You"}</span>
									{message.role === "assistant" && supportsSpeech && (
										<button
											className="message-voice"
											type="button"
											onClick={() => speak(message.content)}
											title="Replay Tina"
											aria-label="Replay Tina"
										>
											<Volume2 size={16} />
										</button>
									)}
								</div>
								<p>{message.content}</p>
							</article>
						))}
						{loading && (
							<article className="message assistant">
								<div className="message-meta">
									<span>Tina</span>
								</div>
								<p>Thinking through the best fit...</p>
							</article>
						)}
					</div>

					<form className="composer" onSubmit={sendMessage}>
						<label htmlFor="chat-input">Your reply</label>
						<div className="input-row">
							<textarea
								id="chat-input"
								value={draft}
								onChange={(event) => setDraft(event.target.value)}
								onKeyDown={handleReplyKeyDown}
								placeholder="Type your answer..."
								rows="2"
							/>
							<div className="composer-actions">
								<button
									className={`icon-button mic-button ${listening ? "active" : ""}`}
									type="button"
									onClick={listening ? stopListening : startListening}
									title={listening ? "Stop listening" : "Start voice input"}
									aria-label={listening ? "Stop listening" : "Start voice input"}
								>
									{listening ? <MicOff size={21} /> : <Mic size={21} />}
								</button>
								<button className="send-button" type="submit" disabled={!canSend}>
									<Send size={20} />
									<span>Submit</span>
								</button>
							</div>
						</div>
						{voiceNotice && (
							<p className="voice-notice" role="status">
								{voiceNotice}
							</p>
						)}
						{!supportsSpeech && (
							<p className="voice-notice" role="status">
								Speech playback is not available in this browser.
							</p>
						)}
						{!supportsListening && (
							<p className="voice-notice" role="status">
								Voice input is not available in this browser.
							</p>
						)}
						{error && <p className="error-message">{error}</p>}
					</form>
				</div>

			</section>
		</main>
	);
}

export default App;
