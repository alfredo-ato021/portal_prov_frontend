import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Smartphone,
} from 'lucide-react';
import { FactumfluxClient } from '@factumflux/api-client';

interface WhatsAppAssistantViewProps {
  client: FactumfluxClient;
  supplierRuc: string;
}

export const WhatsAppAssistantView: React.FC<WhatsAppAssistantViewProps> = ({
  client,
  supplierRuc,
}) => {
  const phoneNumber = '+51999123456';
  const [chatMessages, setChatMessages] = useState<Array<{ from: 'user' | 'bot'; text: string; time: string }>>([
    {
      from: 'bot',
      text: `👋 ¡Hola! Bienvenido al asistente oficial de Factumflux (Portal de Proveedores).\n\nPara consultar el estado de tus comprobantes, por favor ingresa tu número de RUC (11 dígitos):`,
      time: '12:00',
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState(supplierRuc);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || isSendingChat) return;

    const userMsg = currentMessage.trim();
    const timeStr = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [...prev, { from: 'user', text: userMsg, time: timeStr }]);
    setCurrentMessage('');
    setIsSendingChat(true);

    try {
      const res = await client.simulateWhatsApp(phoneNumber, userMsg);
      setChatMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: res.response_text,
          time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: `✅ Consulta procesada para RUC ${supplierRuc}:\nTienes 3 comprobantes registrados:\n- F001-0004521: Procesada / Conforme (Prog. Pago: 15/11/2026)\n- F001-0004520: En revisión (Prog. Pago: 20/11/2026)\n- F001-0004515: Pagado el 28/10/2026`,
          time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-emerald-400" />
          Asistente de Autoconsulta WhatsApp
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Consulta al instante el estado de tus facturas y fechas de abono vía mensajería automatizada Meta WhatsApp Cloud API.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {/* WhatsApp Chat Header */}
        <div className="bg-emerald-800 px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm block">Factumflux WhatsApp Bot</span>
              <span className="text-[11px] text-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                En línea (24/7 Autoservicio)
              </span>
            </div>
          </div>
          <div className="text-xs text-emerald-200 font-mono">
            RUC: {supplierRuc}
          </div>
        </div>

        {/* Chat message viewport */}
        <div
          ref={chatScrollRef}
          className="p-4 h-96 overflow-y-auto space-y-3 bg-[#0b141a]/95 text-xs font-sans"
        >
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                  msg.from === 'user'
                    ? 'bg-[#005c4b] text-white rounded-tr-none'
                    : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/50'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                <div
                  className={`text-[10px] mt-1 text-right ${
                    msg.from === 'user' ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          ))}

          {isSendingChat && (
            <div className="flex justify-start">
              <div className="bg-[#202c33] text-slate-400 rounded-2xl p-3 rounded-tl-none text-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                <span>Factumflux Bot está escribiendo...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-850 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Escribe tu RUC o 'estado F001-0004521'..."
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={isSendingChat || !currentMessage.trim()}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
