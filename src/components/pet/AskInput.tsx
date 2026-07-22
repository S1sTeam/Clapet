import React, { useState } from 'react';

interface AskInputProps {
  visible: boolean;
  onSend: (text: string) => void;
}

export const AskInput: React.FC<AskInputProps> = ({ visible, onSend }) => {
  const [text, setText] = useState('');

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form
      id="ask-input-container"
      onSubmit={handleSubmit}
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <input
        type="text"
        id="ask-input"
        placeholder="Спроси меня о чём угодно..."
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
      />
      <button type="submit" id="ask-send-btn">
        Отправить
      </button>
    </form>
  );
};
