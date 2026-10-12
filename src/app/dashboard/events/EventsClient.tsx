"use client";

import { useState } from "react";
import Link from "next/link";
import { Select } from "@/components/ui/Select";
import { Plus, Calendar, Loader2, QrCode, Users } from "lucide-react";

interface EventItem {
  id: string;
  name: string;
  date: string | null;
  description: string | null;
  createdAt: string;
  _count: { certificates: number };
  defaultTemplateId?: string | null;
}

interface EventsClientProps {
  initialEvents: EventItem[];
  templates: { id: string; name: string }[];
}

export default function EventsClient({ initialEvents, templates }: EventsClientProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [activeMobileTab, setActiveMobileTab] = useState<"list" | "create">("list");
  const [isCreating, setIsCreating] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [defaultTemplateId, setDefaultTemplateId] = useState("");
  const [defaultRole, setDefaultRole] = useState("Participant");

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
          description: newEventDesc,
          defaultTemplateId: defaultTemplateId || null,
          defaultRole: defaultRole
        })
      });

      if (res.ok) {
        const created = await res.json();
        setEvents([{ ...created, _count: { certificates: 0 } }, ...events]);
        setNewEventName("");
        setNewEventDate("");
        setNewEventDesc("");
        setDefaultTemplateId("");
        setDefaultRole("Participant");
        setActiveMobileTab("list");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating event");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mob-scroll-pane flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-zinc-700 mb-1">
            Events Management
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Organize events and issue batch certificates efficiently.
          </p>
        </div>
      </div>

      {/* Mobile App Segmented Control (Hidden on desktop/tablet xl) */}
      <div className="xl:hidden flex p-1 bg-zinc-100 rounded-xl mb-6 border border-zinc-200/80 shrink-0">
        <button
          type="button"
          onClick={() => setActiveMobileTab("list")}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeMobileTab === "list"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Calendar size={14} />
          <span>All Events ({events.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab("create")}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeMobileTab === "create"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Plus size={14} />
          <span>New Event</span>
        </button>
      </div>

      <div className="mob-flow grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* LEFT COLUMN: Event List */}
        <div className={`mob-flow xl:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex-col h-full min-h-0 ${
          activeMobileTab === "list" ? "flex" : "hidden xl:flex"
        }`}>
          <div className="px-6 py-5 border-b border-zinc-100 bg-white shrink-0 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-700">
              Your Events
            </h2>
          </div>

          <div className="mob-flow flex flex-col flex-1 min-h-0">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <div className="w-12 h-12 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center mb-4">
                  <Calendar size={20} className="text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-700 mb-1">No events found</h3>
                <p className="text-zinc-500 text-sm max-w-sm mb-6">
                  Create your first event to start issuing credentials.
                </p>
              </div>
            ) : (
              <>
                {/* Phones: one card per event. The table below is
                    `table-fixed`, whose minimum width comes from its header
                    text plus cell padding — under that width the Actions
                    column was silently clipped, and four columns at 390px is
                    unreadable anyway. Cards also match what
                    /dashboard/credentials and /dashboard/audit already do.
                    `lg:hidden` keeps the desktop rendering untouched. */}
                <div className="mob-flow lg:hidden flex-1 min-h-0 overflow-y-auto bg-white divide-y divide-zinc-100">
                  {events.map((evt) => (
                    <div key={evt.id} className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-800 truncate">{evt.name}</div>
                          {evt.description && (
                            <div className="mt-0.5 truncate text-xs text-zinc-500">{evt.description}</div>
                          )}
                        </div>
                        <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                          {evt._count.certificates}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-sm text-zinc-500">
                          {evt.date
                            ? new Date(evt.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "TBA"}
                        </span>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/events/${evt.id}`}
                            title="View Attendees"
                            className="mob-card-action inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
                          >
                            <Users size={14} />
                            <span>Roster</span>
                          </Link>
                          <Link
                            href={`/kiosk/${evt.id}`}
                            target="_blank"
                            title="Launch Kiosk"
                            className="mob-card-action inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
                          >
                            <QrCode size={14} />
                            <span>Kiosk</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: the original table, now behind `hidden lg:flex`.
                    The wrapper is the same flex column the fragment used to be
                    laid out as, so nothing shifts at lg and up. */}
                <div className="hidden lg:flex flex-1 flex-col min-h-0">
                  <div className="overflow-y-auto overflow-x-hidden invisible-scrollbar bg-white border-b border-zinc-100 shrink-0">
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr className="bg-zinc-50/50">
                          <th className="w-[40%] px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Event Name</th>
                          <th className="w-[25%] px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                          <th className="w-[20%] px-6 py-3 text-center text-xs font-medium text-zinc-500 uppercase tracking-wider">Issued</th>
                          <th className="w-[15%] px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0 bg-white">
                    <table className="w-full table-fixed text-sm">
                      <tbody className="divide-y divide-zinc-100">
                        {events.map((evt) => (
                          <tr key={evt.id} className="hover:bg-zinc-50/80 transition-colors group">
                            <td className="w-[40%] px-6 py-4 overflow-hidden">
                              <div className="font-medium text-zinc-700 truncate">{evt.name}</div>
                              {evt.description && <div className="text-zinc-500 truncate mt-0.5 text-xs">{evt.description}</div>}
                            </td>
                            <td className="w-[25%] px-6 py-4">
                              <div className="text-zinc-600">
                                {evt.date ? new Date(evt.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "TBA"}
                              </div>
                            </td>
                            <td className="w-[20%] px-6 py-4 text-center">
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700">
                                {evt._count.certificates}
                              </span>
                            </td>
                            <td className="w-[15%] px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={`/dashboard/events/${evt.id}`}
                                  className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
                                  title="View Attendees"
                                >
                                  <Users size={18} />
                                </Link>
                                <Link
                                  href={`/kiosk/${evt.id}`}
                                  target="_blank"
                                  className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
                                  title="Launch Kiosk"
                                >
                                  <QrCode size={18} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Create Event Form */}
        <div className={`mob-flow bg-white border border-zinc-200 rounded-xl shadow-sm flex-col h-full min-h-0 overflow-hidden ${
          activeMobileTab === "create" ? "flex" : "hidden xl:flex"
        }`}>
          <div className="px-6 py-4 border-b border-zinc-100 bg-white shrink-0 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-zinc-700">
              Create New Event
            </h3>
            <button 
              type="submit" 
              form="create-event-form"
              title="Create Event"
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl w-9 h-9 transition-colors flex justify-center items-center shrink-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={isCreating || !newEventName}
            >
              {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} strokeWidth={2.5} />}
            </button>
          </div>
          <form id="create-event-form" onSubmit={handleCreateEvent} className="mob-flow p-6 flex flex-col gap-5 flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Event Name</label>
              <input 
                type="text" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-700/10 focus:border-zinc-700 transition-colors shadow-sm" 
                value={newEventName} 
                onChange={e => setNewEventName(e.target.value)} 
                required 
                placeholder="e.g. Tech Summit 2026" 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Event Date</label>
              <input 
                type="date" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700/10 focus:border-zinc-700 transition-colors shadow-sm" 
                value={newEventDate} 
                onChange={e => setNewEventDate(e.target.value)} 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Description (Optional)</label>
              <textarea 
                className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-700/10 focus:border-zinc-700 transition-colors shadow-sm resize-none overflow-y-auto min-h-[80px]" 
                style={{ scrollbarColor: '#cbd5e1 transparent', scrollbarWidth: 'thin' }}
                value={newEventDesc} 
                onChange={e => setNewEventDesc(e.target.value)} 
                placeholder="Brief description of the event..." 
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Default Role</label>
              <input 
                type="text" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-700/10 focus:border-zinc-700 transition-colors shadow-sm" 
                value={defaultRole} 
                onChange={e => setDefaultRole(e.target.value)} 
                placeholder="e.g. Participant" 
              />
            </div>
            
            <div className="flex flex-col gap-1.5 pb-2">
              <label className="text-sm font-medium text-zinc-700">Automated Kiosk Template (Optional)</label>
              <div className="relative">
                <Select
                  value={defaultTemplateId}
                  onChange={setDefaultTemplateId}
                  options={[
                    { value: "", label: "None (Deferred Batch Issue)" },
                    ...templates.map(t => ({
                      value: t.id,
                      label: t.name
                    }))
                  ]}
                  placeholder="None (Deferred Batch Issue)"
                  className="w-full"
                  dropdownClassName="w-full"
                />
              </div>
              <p className="text-xs text-zinc-500">
                If selected, attendees get this certificate instantly when they scan in at the Kiosk.
              </p>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
