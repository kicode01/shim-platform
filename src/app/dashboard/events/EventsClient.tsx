"use client";

import { useState } from "react";
import Link from "next/link";
import { Select } from "@/components/ui/Select";
import { Plus, Calendar, Loader2, QrCode, Users, Search, Award } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [defaultTemplateId, setDefaultTemplateId] = useState("");
  const [defaultRole, setDefaultRole] = useState("Participant");

  const totalCertificates = events.reduce((sum, e) => sum + (e._count?.certificates || 0), 0);
  const filteredEvents = events.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 sm:py-6 min-h-0 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-700 tracking-tight mb-1">
            Events Management
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium">
            Organize events and issue batch certificates efficiently.
          </p>
        </div>
      </div>

      {/* Mobile App Segmented Control (Pinned under header, hidden on desktop xl) */}
      <div className="xl:hidden flex p-1 bg-zinc-100 rounded-xl mb-3 sm:mb-6 border border-zinc-200/80 shrink-0">
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: Event List */}
        <div className={`xl:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden flex-col h-full min-h-0 ${
          activeMobileTab === "list" ? "flex flex-1" : "hidden xl:flex"
        }`}>
          {/* Desktop-only inner section title (redundant on mobile since top is stuck) */}
          <div className="hidden lg:flex px-6 py-5 border-b border-zinc-100 bg-white shrink-0 items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-700">
              Your Events
            </h2>
          </div>

          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
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
                {/* Mobile: stats, search, and touch-optimized card list */}
                <div className="lg:hidden flex-1 min-h-0 flex flex-col overflow-hidden bg-white">
                  {/* Stats pills */}
                  <div className="p-3 bg-zinc-50 border-b border-zinc-100 grid grid-cols-2 gap-2 shrink-0">
                    <div className="bg-white p-2.5 rounded-lg border border-zinc-200/70 shadow-xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                        <Calendar size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Events</div>
                        <div className="text-sm font-bold text-zinc-900 leading-tight">{events.length}</div>
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-zinc-200/70 shadow-xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Award size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Issued</div>
                        <div className="text-sm font-bold text-zinc-900 leading-tight">{totalCertificates}</div>
                      </div>
                    </div>
                  </div>

                  {/* Search bar */}
                  <div className="p-3 border-b border-zinc-100 bg-white shrink-0">
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events..."
                        className="w-full pl-9 pr-7 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-zinc-500 transition-colors"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-600 px-1 py-0.5"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cards stream */}
                  <div 
                    className="flex-1 min-h-0 overflow-y-auto divide-y divide-zinc-100 overscroll-contain touch-pan-y"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {filteredEvents.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500">
                        No events matching &ldquo;{searchQuery}&rdquo;
                      </div>
                    ) : (
                      filteredEvents.map((evt) => (
                        <div key={evt.id} className="p-4 hover:bg-zinc-50/50 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-zinc-800 text-sm leading-snug truncate">{evt.name}</div>
                              {evt.description && (
                                <div className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{evt.description}</div>
                              )}
                            </div>
                            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 border border-zinc-200/50">
                              <Award size={12} className="text-zinc-500" />
                              {evt._count.certificates}
                            </span>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-500">
                            <span suppressHydrationWarning className="inline-flex items-center gap-1.5">
                              <Calendar size={13} className="text-zinc-400" />
                              {evt.date
                                ? new Date(evt.date).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    timeZone: "UTC",
                                  })
                                : "Date TBA"}
                            </span>
                          </div>

                          {/* Action triad: Roster, Issue, Kiosk */}
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <Link
                              href={`/dashboard/events/${evt.id}`}
                              title="View Attendees Roster"
                              className="mob-card-action flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 active:scale-[0.98] transition-all min-h-[44px]"
                            >
                              <Users size={14} />
                              <span>Roster</span>
                            </Link>
                            <Link
                              href={`/dashboard/generate?event=${evt.id}`}
                              title="Issue Certificate for Event"
                              className="mob-card-action flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 active:scale-[0.98] transition-all min-h-[44px]"
                            >
                              <Award size={14} />
                              <span>Issue</span>
                            </Link>
                            <Link
                              href={`/kiosk/${evt.id}`}
                              target="_blank"
                              title="Launch Self-Check-in Kiosk"
                              className="mob-card-action flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] transition-all min-h-[44px]"
                            >
                              <QrCode size={14} />
                              <span>Kiosk</span>
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
                              <div suppressHydrationWarning className="text-zinc-600">
                                {evt.date ? new Date(evt.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : "TBA"}
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
        <div className={`bg-white border border-zinc-200 rounded-xl shadow-sm flex-col h-full min-h-0 overflow-hidden ${
          activeMobileTab === "create" ? "flex flex-1" : "hidden xl:flex"
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
          <form id="create-event-form" onSubmit={handleCreateEvent} className="p-4 sm:p-6 flex flex-col gap-5 flex-1 min-h-0 overflow-y-auto">
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

            {/* Mobile Submit Button */}
            <div className="pt-2 xl:hidden shrink-0">
              <button
                type="submit"
                disabled={isCreating || !newEventName}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Creating Event...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} strokeWidth={2.5} />
                    <span>Create Event</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
