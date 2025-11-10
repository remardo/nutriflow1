
import React from 'react';
import './TelegramFlow.css';
import { Card } from '../../components/Card/Card';
import { Tag } from '../../components/Tag/Tag';

type Message = {
  from: 'client' | 'bot';
  text: string;
};

const initialDialog: Message[] = [
  {
    from: 'bot',
    text: '👋 Привет! Введите код, который вы получили от своего нутрициолога.',
  },
  {
    from: 'client',
    text: 'ANNA-1024',
  },
  {
    from: 'bot',
    text: 'Отлично, Анна! Ваш профиль привязан. Отправляйте фото или описание приёмов пищи, я посчитаю КБЖУ.',
  },
  {
    from: 'client',
    text: 'Овсянка на воде 60 г, банан, 10 г грецких орехов.',
  },
  {
    from: 'bot',
    text: 'Завтрак добавлен: 430 ккал · 16 г Б · 14 г Ж · 56 г У · 7 г клетчатки. Сегодня вы набрали 32% белка и 28% клетчатки от цели.',
  },
];

export const TelegramFlow: React.FC = () => {
  const [messages, setMessages] = React.useState<Message[]>(initialDialog);
  const [input, setInput] = React.useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const updated: Message[] = [
      ...messages,
      { from: 'client', text: input.trim() },
      {
        from: 'bot',
        text:
          'Mock-backend: сообщение отправлено в Telegram Bot Service → Nutrition Analysis Service. В реальной системе здесь создаётся Meal и обновляется ClientDayStats.',
      },
    ];
    setMessages(updated);
    setInput('');
  };

  return (
    <div className="TelegramFlowRoot">
      <Card
        title="Telegram-бот: поток взаимодействия"
        subtitle="Bot Service ↔ Backend API ↔ Nutrition Analysis"
      >
        <div className="TelegramFlow-layout">
          <div className="TelegramFlow-chat">
            <div className="TelegramFlow-chat-window">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={
                    'TelegramFlow-bubble ' +
                    (m.from === 'client'
                      ? 'TelegramFlow-bubble--client'
                      : 'TelegramFlow-bubble--bot')
                  }
                >
                  {m.text}
                </div>
              ))}
            </div>
            <div className="TelegramFlow-inputRow">
              <input
                className="TelegramFlow-input"
                placeholder="Напишите приём пищи или команду..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
              />
              <button className="TelegramFlow-send" onClick={handleSend}>
                ➤
              </button>
            </div>
          </div>
          <div className="TelegramFlow-explainer">
            <div className="TelegramFlow-sectionTitle">
              Поток данных (упрощённо)
            </div>
            <ol className="TelegramFlow-steps">
              <li>
                Клиент пишет боту → Bot Service получает update от Telegram (webhook).
              </li>
              <li>
                Bot Service валидирует сообщение и вызывает Backend API
                (<code>/clients/{'{id}'}/meals</code>).
              </li>
              <li>
                Nutrition Analysis Service считает КБЖУ и нутриенты, обновляет Meal и ClientDayStats.
              </li>
              <li>
                При значимых отклонениях создаются Notification и Event, при необходимости бот
                отправляет предупреждение.
              </li>
            </ol>
            <Tag
              label="Клиент не редактирует итоги анализа — только нутрициолог"
              color="orange"
              subtle
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
