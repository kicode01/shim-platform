"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Loader2, Trash2 } from "lucide-react";

interface EventItem {
  id: string;
  name: string;
  date: string | null;
  description: string | null;
  createdAt: string;
  _count: { certificates: number };
}

export default function EventsClient({ initialEvents }: { initialEvents: EventItem[] }) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [isCreating, setIsCreating] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEventName,
          date: newEventDate || null,
          description: newEventDesc
        })
      });

      if (res.ok) {
        const created = await res.json();
        setEvents([{ ...created, _count: { certificates: 0 } }, ...events]);
        setNewEventName("");
        setNewEventDate("");
        setNewEventDesc("");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating event");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-8 py-6 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-black tracking-tighter uppercase leading-none mb-2">
            Events Management
          </h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">
            Organize events and issue batch certificates efficiently.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN: Event List */}
        <div className="xl:col-span-2 bg-white border-2 border-black overflow-hidden flex flex-col h-full min-h-0">
          <div className="p-6 border-b-2 border-black bg-white shrink-0">
            <h2 className="text-xl font-bold text-black tracking-tighter uppercase">
              Your Events
            </h2>
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full text-gray-400">
                <div className="w-16 h-16 bg-white border-2 border-black flex items-center justify-center mb-6">
                  <Calendar size={24} className="text-black" />
                </div>
                <h3 className="text-2xl font-bold text-black uppercase tracking-tighter mb-2">No events found</h3>
                <p className="text-gray-500 font-medium max-w-sm mb-8">
                  Create your first event to start issuing credentials.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-y-scroll overflow-x-hidden invisible-scrollbar bg-white border-b-2 border-black shrink-0">
                <table className="table-modern w-full table-fixed">
                  <thead>
                    <tr>
                      <th className="w-[50%] px-4 py-4 text-left text-[0.65rem] font-bold text-black uppercase tracking-widest !border-b-0">Event Name</th>
                      <th className="w-[30%] px-4 py-4 text-left text-[0.65rem] font-bold text-black uppercase tracking-widest !border-b-0">Date</th>
                      <th className="w-[20%] px-4 py-4 text-right text-[0.65rem] font-bold text-black uppercase tracking-widest !border-b-0">Certificates Issued</th>
                    </tr>
                  </thead>
                </table>
              </div>
                <div className="overflow-y-scroll overflow-x-hidden flex-1 min-h-0 bg-white">
                  <table className="table-modern w-full table-fixed">
                    <tbody className="divide-y-2 divide-gray-100">
                      {events.map((evt) => (
                        <tr key={evt.id} className="hover:bg-gray-50 transition-colors">
                          <td className="w-[30%] px-4 py-3 overflow-hidden">
                            <div className="font-bold text-sm text-black mb-1 uppercase tracking-wide truncate">{evt.name}</div>
                            {evt.description && <div className="text-xs font-mono text-gray-500 truncate">{evt.description}</div>}
                          </td>
                          <td className="w-[30%] px-4 py-3">
                            <div className="text-sm font-bold text-gray-600 font-mono">
                              {evt.date ? new Date(evt.date).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) : "TBA"}
                            </div>
                          </td>
                          <td className="w-[20%] px-4 py-3 text-right">
                            <div className="text-sm font-bold text-black bg-gray-100 px-3 py-1 inline-block border-2 border-transparent">
                              {evt._count.certificates}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Create Event Form */}
        <div className="bg-white border-2 border-black flex flex-col h-full min-h-0 overflow-y-auto">
          <div className="p-6 border-b-2 border-black bg-white shrink-0">
            <h3 className="text-xl font-bold text-black tracking-tighter uppercase">
              Create New Event
            </h3>
          </div>
          <form onSubmit={handleCreateEvent} className="p-6 flex flex-col gap-6 flex-1 min-h-0">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-black uppercase tracking-widest">Event Name</label>
              <input 
                type="text" 
                className="input-field border-2 border-black focus:outline-none focus:border-black rounded-none" 
                value={newEventName} 
                onChange={e => setNewEventName(e.target.value)} 
                required 
                placeholder="E.G. TECH SUMMIT 2026" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-black uppercase tracking-widest">Event Date</label>
              <input 
                type="date" 
                className="input-field border-2 border-black focus:outline-none focus:border-black rounded-none font-mono" 
                value={newEventDate} 
                onChange={e => setNewEventDate(e.target.value)} 
              />
            </div>
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <label className="text-xs font-bold text-black uppercase tracking-widest">Description (Optional)</label>
              <textarea 
                className="input-field border-2 border-black focus:outline-none focus:border-black rounded-none resize-none overflow-y-scroll flex-1 min-h-[120px]" 
                style={{ scrollbarColor: '#cbd5e1 #f8fafc', scrollbarWidth: 'thin' }}
                value={newEventDesc} 
                onChange={e => setNewEventDesc(e.target.value)} 
                placeholder="SHORT DESCRIPTION" 
              />
            </div>
            <button type="submit" className="btn-primary w-full uppercase tracking-widest font-bold flex justify-center items-center gap-2 mt-auto shrink-0" disabled={isCreating || !newEventName}>
              {isCreating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              <span>Create Event</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
