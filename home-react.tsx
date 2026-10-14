import { Cloud, Play, Smartphone } from "lucide-react-native";

const ago = (d: string) => {
  const h = Math.round(
    (new Date("2026-10-06T18:00").getTime() - new Date(d).getTime()) / 36e5,
  );
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

const u = (id: string, w = 800, h = 1000) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format`;

const projects: any = [
  {
    id: "p1",
    name: "Harbor St. Renovation",
    client: "Malloy Builders",
    color: "#7dd3fc",
    created: "2026-08-12",
    folders: [
      { id: "f1", name: "Foundation" },
      { id: "f2", name: "Framing" },
      { id: "f3", name: "Walkthroughs" },
    ],
    media: [
      {
        id: "m1",
        kind: "photo",
        src: u("1503387762-592deb58ef4e"),
        date: "2026-10-05T16:12",
        location: "Portland, ME",
        tags: ["framing", "north wall"],
        device: "iPhone 17 Pro",
        storage: "cloud",
        size: 4.2,
        folder: "f2",
      },
      {
        id: "m2",
        kind: "video",
        src: u("1541888946425-d81bb19240f5"),
        date: "2026-10-04T09:40",
        location: "Portland, ME",
        tags: ["walkthrough"],
        device: "iPhone 17 Pro",
        storage: "cloud",
        duration: "1:24",
        size: 182,
        folder: "f3",
      },
      {
        id: "m3",
        kind: "photo",
        src: u("1504307651254-35680f356dfd"),
        date: "2026-09-28T11:05",
        location: "Portland, ME",
        tags: ["foundation", "inspection"],
        device: "iPhone 17 Pro",
        storage: "local",
        size: 3.8,
        folder: "f1",
      },
      {
        id: "m4",
        kind: "photo",
        src: u("1590644365607-1c5a519a7a37"),
        date: "2026-09-14T14:22",
        location: "Portland, ME",
        tags: ["site", "before"],
        device: "iPhone 15",
        storage: "cloud",
        size: 3.1,
      },
    ],
  },
  {
    id: "p2",
    name: "Linden Ave. Mixed-Use",
    client: "Corbel Development",
    color: "#fcd34d",
    created: "2026-09-02",
    folders: [
      { id: "f4", name: "Structural steel" },
      { id: "f5", name: "Safety" },
    ],
    media: [
      {
        id: "m5",
        kind: "photo",
        src: u("1517089596392-fb9a9033e05b"),
        date: "2026-10-06T08:30",
        location: "Cambridge, MA",
        tags: ["tower crane", "steel erection"],
        device: "iPhone 17 Pro",
        storage: "local",
        size: 5.0,
        folder: "f4",
      },
      {
        id: "m6",
        kind: "photo",
        src: u("1487958449943-2429e8be8625"),
        date: "2026-10-01T13:15",
        location: "Cambridge, MA",
        tags: ["level 4", "decking"],
        device: "iPhone 17 Pro",
        storage: "cloud",
        size: 4.6,
        folder: "f4",
      },
      {
        id: "m7",
        kind: "video",
        src: u("1429497419816-9ca5cfb4571a"),
        date: "2026-09-20T17:48",
        location: "Cambridge, MA",
        tags: ["crane lift", "safety"],
        device: "iPhone 17 Pro",
        storage: "cloud",
        duration: "0:48",
        size: 96,
        folder: "f5",
      },
    ],
  },
  {
    id: "p3",
    name: "Route 9 Bridge Repair",
    client: "VT Agency of Transportation",
    color: "#86efac",
    created: "2026-07-21",
    media: [
      {
        id: "m8",
        kind: "photo",
        src: u("1581094794329-c8112a89af12"),
        date: "2026-10-03T10:02",
        location: "Burlington, VT",
        tags: ["inspection", "deck"],
        device: "iPhone 15",
        storage: "cloud",
        size: 3.4,
      },
      {
        id: "m9",
        kind: "photo",
        src: u("1504307651254-35680f356dfd"),
        date: "2026-08-30T15:30",
        location: "Burlington, VT",
        tags: ["rebar", "pier 2"],
        device: "iPhone 15",
        storage: "local",
        size: 2.9,
      },
    ],
  },
  {
    id: "p4",
    name: "Ward St. Warehouse Retrofit",
    client: "Kahn Industrial",
    color: "#f0abfc",
    created: "2026-06-03",
    media: [
      {
        id: "m10",
        kind: "photo",
        src: u("1541888946425-d81bb19240f5"),
        date: "2026-09-11T12:00",
        location: "Brooklyn, NY",
        tags: ["demolition", "before"],
        device: "iPhone 17 Pro",
        storage: "cloud",
        size: 4.9,
      },
    ],
  },
  {
    id: "p5",
    name: "Bayview Medical Center",
    client: "Hollis & Grant GC",
    color: "#fca5a5",
    created: "2026-05-18",
    media: [
      {
        id: "m11",
        kind: "photo",
        src: u("1487958449943-2429e8be8625"),
        date: "2026-10-02T07:45",
        location: "Providence, RI",
        tags: ["curtain wall", "east elevation"],
        device: "iPhone 17 Pro",
        storage: "cloud",
        size: 4.4,
      },
      {
        id: "m12",
        kind: "photo",
        src: u("1581094794329-c8112a89af12"),
        date: "2026-09-25T10:20",
        location: "Providence, RI",
        tags: ["MEP", "rough-in"],
        device: "iPhone 17 Pro",
        storage: "local",
        size: 3.7,
      },
      {
        id: "m13",
        kind: "video",
        src: u("1429497419816-9ca5cfb4571a"),
        date: "2026-09-08T16:05",
        location: "Providence, RI",
        tags: ["roof", "walkthrough"],
        device: "iPhone 17 Pro",
        storage: "cloud",
        duration: "2:10",
        size: 248,
      },
    ],
  },
  {
    id: "p6",
    name: "Elm Ridge Subdivision",
    client: "Northgate Homes",
    color: "#fdba74",
    created: "2026-04-09",
    media: [
      {
        id: "m14",
        kind: "photo",
        src: u("1503387762-592deb58ef4e"),
        date: "2026-09-30T12:40",
        location: "Nashua, NH",
        tags: ["lot 14", "framing"],
        device: "iPhone 15",
        storage: "cloud",
        size: 3.2,
      },
      {
        id: "m15",
        kind: "photo",
        src: u("1590644365607-1c5a519a7a37"),
        date: "2026-09-17T09:10",
        location: "Nashua, NH",
        tags: ["grading", "utilities"],
        device: "iPhone 15",
        storage: "local",
        size: 2.8,
      },
    ],
  },
  {
    id: "p7",
    name: "Pier 4 Seawall",
    client: "Boston Harbor Authority",
    color: "#a5b4fc",
    created: "2026-03-27",
    media: [
      {
        id: "m16",
        kind: "photo",
        src: u("1504307651254-35680f356dfd"),
        date: "2026-09-22T14:55",
        location: "Boston, MA",
        tags: ["formwork", "pour 3"],
        device: "iPhone 17 Pro",
        storage: "cloud",
        size: 4.1,
      },
      {
        id: "m17",
        kind: "video",
        src: u("1541888946425-d81bb19240f5"),
        date: "2026-09-05T11:30",
        location: "Boston, MA",
        tags: ["pile driving"],
        device: "iPhone 17 Pro",
        storage: "cloud",
        duration: "0:36",
        size: 71,
      },
    ],
  },
  {
    id: "p8",
    name: "Maple School Addition",
    client: "Concord School District",
    color: "#5eead4",
    created: "2026-02-14",
    media: [
      {
        id: "m18",
        kind: "photo",
        src: u("1517089596392-fb9a9033e05b"),
        date: "2026-09-19T08:15",
        location: "Concord, NH",
        tags: ["steel", "gymnasium"],
        device: "iPhone 15",
        storage: "local",
        size: 3.9,
      },
      {
        id: "m19",
        kind: "photo",
        src: u("1503387762-592deb58ef4e"),
        date: "2026-08-28T13:00",
        location: "Concord, NH",
        tags: ["punch list", "classrooms"],
        device: "iPhone 15",
        storage: "cloud",
        size: 3.5,
      },
    ],
  },
];

function Header({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="px-5 mb-5 flex items-end justify-between">
      <div>
        {eyebrow && (
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/45 mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[34px] leading-none font-extrabold tracking-tight">
          {title}
        </h1>
      </div>
      {right}
    </div>
  );
}

function StorageCard({
  icon: Icon,
  label,
  used,
  total,
  tint,
}: {
  icon: typeof Cloud;
  label: string;
  used: number;
  total: number;
  tint: string;
}) {
  const pct = Math.round((used / total) * 100);
  return (
    <div className="glass rounded-3xl p-4">
      <div className="flex items-center gap-2 text-white/70 text-xs font-semibold">
        <Icon className="size-4" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">
        {(total - used).toFixed(1)}
        <span className="text-sm text-white/50 font-medium"> GB free</span>
      </p>
      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: tint }}
        />
      </div>
      <p className="mt-2 font-mono text-[10px] text-white/45">
        {used} / {total} GB · {pct}%
      </p>
    </div>
  );
}

function Home() {
  const activity = projects
    .flatMap((p) => p.media.map((m) => ({ ...m, project: p })))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const recentProjects = [
    ...new Map(activity.map((a) => [a.project.id, a.project])).values(),
  ] as any;

  return (
    <div>
      <Header eyebrow="Tuesday, Oct 6" title="Good evening" />
      <section className="px-5 grid grid-cols-2 gap-3">
        <StorageCard
          icon={Cloud}
          label="Cloud"
          used={38.4}
          total={200}
          tint="linear-gradient(90deg,#38bdf8,#818cf8)"
        />
        <StorageCard
          icon={Smartphone}
          label="On device"
          used={201}
          total={256}
          tint="linear-gradient(90deg,#fbbf24,#f87171)"
        />
      </section>

      <section className="mt-7">
        <h2 className="px-5 mb-3 text-sm font-semibold text-white/60">
          Jump back in
        </h2>
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-5">
          {recentProjects.map((p) => (
            <button key={p.id} className="shrink-0 w-36 text-left group">
              <div className="relative h-44 rounded-3xl overflow-hidden bg-white/5">
                <img
                  src={p.media[0]?.src}
                  alt={p.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-2 bottom-2 glass rounded-2xl px-3 py-2">
                  <p className="text-[13px] font-semibold leading-tight truncate">
                    {p.name}
                  </p>
                  <p className="font-mono text-[10px] text-white/60">
                    {p.media.length} items
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-7 px-5">
        <h2 className="mb-3 text-sm font-semibold text-white/60">
          Recent activity
        </h2>
        <ul className="glass rounded-3xl divide-y divide-white/10">
          {activity.map((a) => (
            <li key={a.id}>
              <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors first:rounded-t-3xl">
                <div className="relative size-12 rounded-xl overflow-hidden bg-white/10 shrink-0">
                  <img
                    src={a.src.replace("w=800&h=1000", "w=120&h=120")}
                    alt={a.tags.join(", ")}
                    className="size-full object-cover"
                  />
                  {a.kind === "video" && (
                    <Play className="absolute inset-0 m-auto size-4 fill-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">
                    {a.kind === "video" ? "Video" : "Photo"} added · {a.tags[0]}
                  </p>
                  <p className="text-xs text-white/55 truncate flex items-center gap-1">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: a.project.color }}
                    />
                    {a.project.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-[10px] text-white/45">
                    {ago(a.date)}
                  </p>
                  {a.storage === "cloud" ? (
                    <Cloud className="size-3.5 ml-auto mt-1 text-sky-300" />
                  ) : (
                    <Smartphone className="size-3.5 ml-auto mt-1 text-amber-300" />
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
