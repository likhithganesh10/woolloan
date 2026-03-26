import React, { useState } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';

const mockResponses = {
  'thin file': "A 'thin-file' applicant has very little credit history (0-1 credit cards). Traditional systems reject them — CreditIQ helps assess them fairly.",
  upload: "Drag & drop a CSV file into the upload zone, or click to browse. Both individual bank statements and bulk datasets are supported.",
  assess: "In Bulk mode, click 'Assess Applicant' after uploading a CSV to input an individual's details and get a risk score.",
  individual: 'Individual mode analyses a single person\'s bank transaction CSV — income, spending, savings rate, and estimated credit score.',
  bulk: 'Bulk mode takes a Kaggle-style multi-user CSV and shows population-level credit analytics.',
  score: 'The credit score is a heuristic between 300–850 based on savings rate, debt-to-income ratio, income level, and loan duration.',
  hello: 'Hi! I\'m your CreditIQ assistant. Ask me about credit scoring, how to use the app, or what the results mean.',
  default: "I'm still learning new topics! Try asking about 'thin file', 'credit score', 'upload', 'individual mode', or 'bulk mode'.",
};

const WizardHelper = ({ message, isVisible }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([{ sender: 'wizard', text: "Hi! I'm your CreditIQ assistant. Ask me anything about credit scoring or how to use the app!" }]);
  const [inputVal, setInputVal] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const newMsgs = [...messages, { sender: 'user', text: inputVal }];
    setMessages(newMsgs);
    const lower = inputVal.toLowerCase();
    let reply = mockResponses.default;
    Object.keys(mockResponses).forEach(key => { if (lower.includes(key)) reply = mockResponses[key]; });
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'wizard', text: reply }]);
      const box = document.getElementById('chat-msgs');
      if (box) box.scrollTop = box.scrollHeight;
    }, 500);
    setInputVal('');
  };

  if (!isVisible) return null;

  return (
    <>
      {chatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquare size={16} /> CreditIQ Assistant</span>
            <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
          </div>
          <div className="chat-messages" id="chat-msgs">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.sender}`}>{m.text}</div>
            ))}
          </div>
          <form onSubmit={handleSend} className="chat-input-area">
            <input className="chat-input" value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Ask a question..." />
            <button type="submit" className="btn btn-black" style={{ padding: '0.5rem 0.75rem' }}><Send size={15} /></button>
          </form>
        </div>
      )}

      <div className="wizard-container" onClick={() => setChatOpen(o => !o)}>
        {!chatOpen && message && (
          <div className="wizard-bubble">
            {message}
            <div className="wizard-actions">
              <button className="btn btn-black" style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }} onClick={e => { e.stopPropagation(); setChatOpen(true); }}>
                <MessageSquare size={13} /> Chat
              </button>
            </div>
          </div>
        )}
        <img src="/wizard.png" alt="Assistant" className="wizard-image" />
      </div>
    </>
  );
};

export default WizardHelper;
