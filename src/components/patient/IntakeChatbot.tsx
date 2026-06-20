import { Send, Bot, User, Info, Plus, Check, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { ChatMessage, Symptom, TimelineNode } from '../../types';

// Symptom extraction state machine
type ChatState =
  | 'IDLE'
  | 'AWAIT_DURATION'
  | 'AWAIT_SEVERITY'
  | 'AWAIT_TRIGGERS'
  | 'AWAIT_DOCTOR_REVIEWED'
  | 'CONFIRM_ADD';

interface PendingSymptom {
  name: string;
  duration: string;
  severity: Symptom['severity'];
  triggers: string;
  doctorReviewed: boolean;
}

const SYMPTOM_KEYWORDS = [
  'pain', 'ache', 'sore', 'hurt', 'burning', 'itch', 'rash', 'swollen', 'swelling',
  'tired', 'fatigue', 'breathless', 'breath', 'cough', 'wheeze', 'sneeze', 'headache',
  'nausea', 'dizzy', 'fever', 'chills', 'blurry', 'numb', 'tingling', 'cramping',
  'having', 'experiencing', 'feeling', 'noticed', 'started', 'symptom',
];

function detectSymptom(text: string): string | null {
  const lower = text.toLowerCase();
  if (SYMPTOM_KEYWORDS.some((kw) => lower.includes(kw))) {
    // Try to extract the symptom noun phrase — simplistic but good enough for demo
    const match =
      lower.match(/(?:i(?:'m| am| have been| have| keep)[\s\w]*?(?:having|experiencing|feeling|noticing|getting)?)\s+([a-z\s]+?)(?:\s*\.|\s*$|,|\s+for|\s+since|\s+when)/i) ||
      lower.match(/(?:having|experiencing|feeling|noticing)\s+([a-z\s]+?)(?:\s*\.|\s*$|,|\s+for|\s+since)/i);
    if (match) return match[1].trim();
    return null; // keyword matched but can't extract name cleanly — let user clarify
  }
  return null;
}

const STATIC_RESPONSES: { trigger: string; response: string }[] = [
  { trigger: 'asthma', response: "Thanks for mentioning your asthma. Do you remember when you were first diagnosed? Was it confirmed by a doctor?" },
  { trigger: 'inhaler', response: "Are you currently still using your inhaler regularly? How often would you say you reach for your rescue inhaler in a typical week?" },
  { trigger: 'eczema', response: "I see eczema in your record. Are you still using the prescribed cream? Have you noticed any new or worsening patches recently?" },
  { trigger: 'allergy', response: "I can see shellfish and penicillin allergies on file. Do you carry an EpiPen? Has your allergy been formally tested by an allergist?" },
  { trigger: 'family', response: "Family history matters. Do you know if any other relatives have asthma, eczema, or autoimmune conditions? What about your father's side?" },
  { trigger: 'medication', response: "Are you still taking cetirizine daily? And are you using the Fluticasone inhaler every day as prescribed, or only when you have symptoms?" },
  { trigger: 'doctor', response: "Do you have a regular family physician or specialist for this? If you have visit notes or test results, you can upload them under the Upload tab." },
];

const DEFAULT_RESPONSES = [
  "Thanks for sharing that. Was this something a doctor confirmed, or did you notice it yourself?",
  "That's helpful. Do you have a rough date for when this started — even a season or year is useful.",
  "Understood. Do you have any documents — a prescription, lab result, or discharge summary — that mention this?",
  "Good to know. Has this changed recently, or has it been fairly consistent?",
  "Thank you. Do any of your relatives have a similar history? Family patterns can be important context.",
];
let defaultIdx = 0;

export default function IntakeChatbot() {
  const { chatMessages, addChatMessage, addSymptomFromChat, setActivePatientTab } = useApp();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>('IDLE');
  const [pendingSymptom, setPendingSymptom] = useState<Partial<PendingSymptom>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  function botReply(content: string, delay = 1000) {
    setIsTyping(true);
    setTimeout(() => {
      addChatMessage({
        messageId: `cm-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setIsTyping(false);
    }, delay);
  }

  function handleSymptomConfirm(confirmed: boolean) {
    if (!confirmed || !pendingSymptom.name) {
      setChatState('IDLE');
      setPendingSymptom({});
      botReply("No problem — I won't add that. Let me know if there's anything else you'd like to record.");
      return;
    }

    const symptom: Symptom = {
      symptomId: `sym-${Date.now()}`,
      name: pendingSymptom.name!,
      startDate: pendingSymptom.duration || 'Unknown',
      severity: pendingSymptom.severity || 'MODERATE',
      frequency: 'As reported via assistant',
      notes: `Reported via Anamoria Assistant. Triggers: ${pendingSymptom.triggers || 'not specified'}.`,
      triggers: pendingSymptom.triggers || '',
      ongoing: true,
      hasDocuments: false,
      doctorReviewed: pendingSymptom.doctorReviewed || false,
      verificationStatus: 'NEEDS_REVIEW',
    };

    const timelineNode: TimelineNode = {
      nodeId: `tn-chat-${Date.now()}`,
      eventDate: new Date().toISOString().split('T')[0],
      approximateDate: true,
      title: `Symptom reported — ${pendingSymptom.name}`,
      summary: `Patient reported ${pendingSymptom.name} via the Anamoria Assistant. Severity: ${pendingSymptom.severity || 'moderate'}. Needs physician review.`,
      details: `${pendingSymptom.name} — reported via intake assistant. Duration: ${pendingSymptom.duration || 'unknown'}. Triggers: ${pendingSymptom.triggers || 'none specified'}. Doctor reviewed: ${pendingSymptom.doctorReviewed ? 'yes' : 'no'}.`,
      sourceType: 'CHAT_ASSISTANT',
      contributorId: 'pat-001',
      contributorName: 'Layla Hassan (via assistant)',
      contributorRole: 'PATIENT',
      confidenceLevel: 'LOW',
      verificationStatus: 'NEEDS_REVIEW',
      relatedDocuments: [],
      physicianNotes: [],
      category: 'SYMPTOM',
      tags: ['symptom', 'chat-reported', 'unreviewed'],
      missingInfo: ['Awaiting physician review', 'No supporting documents'],
    };

    addSymptomFromChat(symptom, timelineNode);
    setChatState('IDLE');
    setPendingSymptom({});

    botReply(
      `Done — I've added "${pendingSymptom.name}" to your Symptoms list and Timeline, labelled as Patient-reported — Needs Review. Your physician will be able to see it and follow up.`
    );
  }

  function processMessage(text: string) {
    const lower = text.toLowerCase();

    if (chatState === 'AWAIT_DURATION') {
      setPendingSymptom((p) => ({ ...p, duration: text.trim() }));
      setChatState('AWAIT_SEVERITY');
      botReply("How would you describe the severity — mild, moderate, or severe?");
      return;
    }
    if (chatState === 'AWAIT_SEVERITY') {
      const sev: Symptom['severity'] =
        lower.includes('mild') ? 'MILD' : lower.includes('severe') ? 'SEVERE' : 'MODERATE';
      setPendingSymptom((p) => ({ ...p, severity: sev }));
      setChatState('AWAIT_TRIGGERS');
      botReply("Are there any triggers you've noticed — like exercise, cold air, stress, food, or anything else? Type 'none' if unsure.");
      return;
    }
    if (chatState === 'AWAIT_TRIGGERS') {
      const triggers = lower === 'none' ? '' : text.trim();
      setPendingSymptom((p) => ({ ...p, triggers }));
      setChatState('AWAIT_DOCTOR_REVIEWED');
      botReply("Has a doctor reviewed this symptom yet?");
      return;
    }
    if (chatState === 'AWAIT_DOCTOR_REVIEWED') {
      const reviewed = lower.includes('yes') || lower.includes('yeah') || lower.includes('yep') || lower.includes('they have');
      setPendingSymptom((p) => ({ ...p, doctorReviewed: reviewed }));
      setChatState('CONFIRM_ADD');
      return;
    }

    // IDLE — check for symptom keywords
    const detected = detectSymptom(lower);
    if (detected && detected.length > 2 && detected.length < 60) {
      setPendingSymptom({ name: detected });
      setChatState('AWAIT_DURATION');
      botReply(
        `It sounds like you're experiencing "${detected}". I can add this to your symptom record so your physician can review it. First — when did this start? (e.g. "a few weeks ago", "since November")`
      );
      return;
    }

    // Check if they mention a symptom but we couldn't extract it cleanly
    if (SYMPTOM_KEYWORDS.some((kw) => lower.includes(kw)) && !detected) {
      setChatState('AWAIT_DURATION');
      // Ask them to name it
      const name = text.trim().slice(0, 60);
      setPendingSymptom({ name });
      botReply(
        `It sounds like you might have a new symptom to record. Can you tell me approximately when this started?`
      );
      return;
    }

    // Static keyword responses
    const match = STATIC_RESPONSES.find((r) => lower.includes(r.trigger));
    if (match) {
      botReply(match.response);
      return;
    }

    // Fallback
    botReply(DEFAULT_RESPONSES[defaultIdx++ % DEFAULT_RESPONSES.length]);
  }

  function sendMessage() {
    if (!input.trim() || chatState === 'CONFIRM_ADD') return;
    const userMsg: ChatMessage = {
      messageId: `cm-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    addChatMessage(userMsg);
    const text = input.trim();
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      processMessage(text);
    }, 800);
  }

  const showConfirmCard = chatState === 'CONFIRM_ADD';

  return (
    <div className="flex flex-col h-full">
      {/* Disclaimer */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">
          The Anamoria Assistant helps organise your health information. It does <strong className="text-gray-600">not diagnose, treat, or replace medical advice.</strong>
        </p>
      </div>

      {/* Suggested prompts */}
      <div className="px-4 py-2.5 border-b border-gray-100">
        <div className="flex flex-wrap gap-1.5">
          {["I've been having headaches", "My eczema has been worse", "I feel short of breath", "Tell me about my medications", "My family history"].map((p) => (
            <button
              key={p}
              onClick={() => { setInput(p); }}
              disabled={chatState !== 'IDLE'}
              className="text-xs border border-gray-200 text-gray-500 px-2.5 py-1 rounded-full hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3">
        {chatMessages.map((msg) => (
          <div key={msg.messageId} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'assistant' ? 'bg-teal-100' : 'bg-gray-100'
            }`}>
              {msg.role === 'assistant'
                ? <Bot className="w-3.5 h-3.5 text-teal-600" />
                : <User className="w-3.5 h-3.5 text-gray-500" />}
            </div>
            <div className={`max-w-[80%] flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                  : 'bg-gray-900 text-white rounded-tr-sm'
              }`}>
                {msg.content}
              </div>
              <span className="text-xs text-gray-300 px-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map((delay) => (
                  <div key={delay} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Symptom confirm card */}
        {showConfirmCard && !isTyping && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="flex-1 max-w-[85%]">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm text-gray-700">
                    I have enough to add this to your record. Here's what I'll save:
                  </p>
                </div>
                <div className="px-4 py-3 space-y-1.5 text-xs text-gray-600">
                  <div className="flex gap-2"><span className="text-gray-400 w-20">Symptom</span><span className="font-medium text-gray-900">{pendingSymptom.name}</span></div>
                  <div className="flex gap-2"><span className="text-gray-400 w-20">Since</span><span>{pendingSymptom.duration || 'Unknown'}</span></div>
                  <div className="flex gap-2"><span className="text-gray-400 w-20">Severity</span><span>{pendingSymptom.severity || 'Moderate'}</span></div>
                  {pendingSymptom.triggers && <div className="flex gap-2"><span className="text-gray-400 w-20">Triggers</span><span>{pendingSymptom.triggers}</span></div>}
                  <div className="flex gap-2"><span className="text-gray-400 w-20">Status</span><span className="text-amber-600 font-medium">Patient-reported — Needs physician review</span></div>
                </div>
                <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => handleSymptomConfirm(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to my record
                  </button>
                  <button
                    onClick={() => handleSymptomConfirm(false)}
                    className="px-3 py-2 text-gray-400 text-xs rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !showConfirmCard && sendMessage()}
            placeholder={showConfirmCard ? 'Please respond above…' : 'Message the assistant…'}
            disabled={showConfirmCard}
            className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-300 disabled:opacity-40"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping || showConfirmCard}
            className="p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
