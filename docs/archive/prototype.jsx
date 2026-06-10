import React, { useState, useMemo } from "react";
import {
  LayoutGrid, ReceiptText, Repeat, Wallet, CreditCard, ListChecks, Settings,
  Landmark, Tags, Users, ChevronLeft, ChevronRight, Moon, Sun, Plus, Download,
  Lock, Trash2, Pencil, X, TrendingUp, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid,
} from "recharts";

/* ============================================================
   Debt Tracker — PROTOTYPE (mock data, ไม่ต่อ DB)
   ใช้ดู layout/flow ทุกหน้า ก่อนค่อยเอาไปต่อ DB จริง
   ============================================================ */

const fmt = (n) =>
  "฿" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const T = (dark) => ({
  appbar: dark ? "#0f1729" : "#1e2a44",
  sidebar: dark ? "#131c2e" : "#ffffff",
  page: dark ? "#0b1220" : "#f6f7f9",
  card: dark ? "#15203a" : "#ffffff",
  cardAlt: dark ? "#1a2742" : "#f8fafc",
  border: dark ? "#243149" : "#e9ebef",
  text: dark ? "#e8edf5" : "#1f2937",
  sub: dark ? "#9aa7bd" : "#6b7280",
  primary: dark ? "#3b82f6" : "#1e2a44",
  primaryText: "#ffffff",
  green: dark ? "#34d399" : "#16a34a",
  orange: dark ? "#fbbf24" : "#ea7317",
  red: dark ? "#f87171" : "#dc2626",
  activeBg: dark ? "#1e3a8a" : "#1e2a44",
});

/* ---------------- mock data (อิงจาก seed จริง) ---------------- */
const BANKS = [
  { id: "bk-ttb", name: "TTB" },
  { id: "bk-uob", name: "UOB" },
];
const CATEGORIES = [
  { id: "c-loan", module: "fix", name: "Loan", color: "#ef4444" },
  { id: "c-family", module: "fix", name: "Family", color: "#f59e0b" },
  { id: "c-util", module: "fix", name: "Utility", color: "#3b82f6" },
  { id: "c-ent", module: "subscription", name: "Entertainment", color: "#8b5cf6" },
  { id: "c-gadget", module: "credit", name: "Gadget", color: "#14b8a6" },
  { id: "c-insure", module: "credit", name: "Insurance", color: "#0ea5e9" },
  { id: "c-donate", module: "credit", name: "Donation", color: "#ec4899" },
];
const CARDS = [
  { id: "cd-soSmart", bankId: "bk-ttb", name: "TTB So Smart", type: "credit", active: true },
  { id: "cd-premier", bankId: "bk-uob", name: "UOB Premier", type: "credit", active: true },
  { id: "cd-tmrw", bankId: "bk-uob", name: "UOB TMRW", type: "credit", active: true },
];
const FIX_TEMPLATES = [
  { id: "f1", name: "Home loan", amount: 7800, categoryId: "c-loan", isVariable: false },
  { id: "f2", name: "Car Loan", amount: 3878.5, categoryId: "c-loan", isVariable: false },
  { id: "f3", name: "Money for Dad", amount: 4000, categoryId: "c-family", isVariable: false },
  { id: "f4", name: "Electricity bill", amount: 2008.73, categoryId: "c-util", isVariable: true },
  { id: "f5", name: "Water bill", amount: 53.27, categoryId: "c-util", isVariable: true },
];
const SUBS = [
  { id: "s1", name: "Netflix", amount: 201, frequency: "monthly", categoryId: "c-ent", renewalDate: "2026-06-29" },
  { id: "s2", name: "YouTube Premium", amount: 85, frequency: "monthly", categoryId: "c-ent", renewalDate: "2026-06-29" },
  { id: "s3", name: "Home Internet", amount: 747.93, frequency: "monthly", categoryId: "c-ent", renewalDate: "2026-06-29" },
  { id: "s4", name: "Microsoft Office 365", amount: 450, frequency: "yearly", categoryId: "c-ent", renewalDate: "2027-04-28" },
  { id: "s5", name: "ค่าส่วนกลาง", amount: 4458, frequency: "yearly", categoryId: "c-ent", renewalDate: "2027-01-16" },
];
const PLANS = [
  { id: "i1", name: "iPad Pro", cardId: "cd-premier", categoryId: "c-gadget", totalAmount: 33860, perAmount: 3386, numInstallments: 10, paid: 5, status: "active" },
  { id: "i2", name: "ลำโพง", cardId: "cd-soSmart", categoryId: "c-gadget", totalAmount: 8990, perAmount: 1498.35, numInstallments: 6, paid: 2, status: "active" },
  { id: "i3", name: "Air pod 4", cardId: "cd-soSmart", categoryId: "c-gadget", totalAmount: 6100, perAmount: 610, numInstallments: 10, paid: 10, status: "done" },
  { id: "i4", name: "เที่ยว", cardId: "cd-premier", categoryId: "c-gadget", totalAmount: 15000, perAmount: 1718, numInstallments: 9, paid: 4, status: "closed_early", payoffAmount: 8000 },
];

const catName = (id) => CATEGORIES.find((c) => c.id === id)?.name || "—";
const catColor = (id) => CATEGORIES.find((c) => c.id === id)?.color || "#94a3b8";
const cardName = (id) => CARDS.find((c) => c.id === id)?.name || "—";
const bankName = (id) => BANKS.find((b) => b.id === id)?.name || "—";

/* ---------------- shared UI ---------------- */
function Card({ t, children, style }) {
  return (
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, ...style }}>
      {children}
    </div>
  );
}
function Btn({ t, children, onClick, variant = "primary", icon: Icon }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500,
    padding: "9px 16px", borderRadius: 12, cursor: "pointer", border: "none", whiteSpace: "nowrap",
  };
  const styles =
    variant === "primary"
      ? { ...base, background: t.primary, color: t.primaryText }
      : { ...base, background: "transparent", color: t.text, border: `1px solid ${t.border}` };
  return (
    <button style={styles} onClick={onClick}>
      {Icon && <Icon size={16} />} {children}
    </button>
  );
}
function Badge({ t, color, children }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 500, color, background: color + "22", padding: "3px 10px", borderRadius: 999 }}>
      {children}
    </span>
  );
}
function Stat({ t, label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: t.sub, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: color || t.text }}>{value}</div>
    </div>
  );
}
function Modal({ t, title, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.card, borderRadius: 18, width: 420, maxWidth: "100%", border: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: t.text }}>{title}</div>
          <X size={20} color={t.sub} style={{ cursor: "pointer" }} onClick={onClose} />
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}
function Field({ t, label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: t.sub, marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}
const inputStyle = (t) => ({
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10,
  border: `1px solid ${t.border}`, background: t.cardAlt, color: t.text, fontSize: 14, outline: "none",
});
function PageHead({ t, title, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: t.text, margin: 0 }}>{title}</h1>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

/* ============================================================
   PAGE: Dashboard (ภาพรวม)
   ============================================================ */
function Dashboard({ t }) {
  const fixMonthly = FIX_TEMPLATES.reduce((s, f) => s + f.amount, 0);
  const subMonthly = SUBS.reduce((s, x) => s + (x.frequency === "monthly" ? x.amount : x.amount / 12), 0);
  const planMonthly = PLANS.filter((p) => p.status === "active").reduce((s, p) => s + p.perAmount, 0);
  const total = fixMonthly + subMonthly + planMonthly;

  const trend = [
    { m: "ม.ค.", v: 19800 }, { m: "ก.พ.", v: 21200 }, { m: "มี.ค.", v: 20650 },
    { m: "เม.ย.", v: 22100 }, { m: "พ.ค.", v: 21500 }, { m: "มิ.ย.", v: Math.round(total) },
  ];
  const byType = [
    { name: "ค่าใช้จ่ายประจำ", value: Math.round(fixMonthly), color: "#3b82f6" },
    { name: "สมาชิก/บริการ", value: Math.round(subMonthly), color: "#8b5cf6" },
    { name: "ผ่อนชำระ", value: Math.round(planMonthly), color: "#14b8a6" },
  ];

  return (
    <div>
      <PageHead t={t} title="ภาพรวม" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 16 }}>
        <Card t={t} style={{ padding: 20 }}><Stat t={t} label="รวมรายจ่าย/เดือน" value={fmt(total)} color={t.primary} /></Card>
        <Card t={t} style={{ padding: 20 }}><Stat t={t} label="ค่าใช้จ่ายประจำ" value={fmt(fixMonthly)} /></Card>
        <Card t={t} style={{ padding: 20 }}><Stat t={t} label="สมาชิก/บริการ" value={fmt(subMonthly)} /></Card>
        <Card t={t} style={{ padding: 20 }}><Stat t={t} label="ผ่อนชำระ (active)" value={fmt(planMonthly)} color={t.orange} /></Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card t={t} style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, color: t.text, fontWeight: 600 }}>
            <TrendingUp size={18} /> แนวโน้มรายจ่าย 6 เดือน
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
              <XAxis dataKey="m" stroke={t.sub} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={t.sub} fontSize={12} tickLine={false} axisLine={false} width={48} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text }} />
              <Bar dataKey="v" fill={t.primary} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card t={t} style={{ padding: 20 }}>
          <div style={{ color: t.text, fontWeight: 600, marginBottom: 14 }}>สัดส่วนรายจ่าย</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={byType} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {byType.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, color: t.text }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8 }}>
            {byType.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: t.sub, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} /> {d.name}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: Fix Cost (ค่าใช้จ่ายประจำ) — design v3
   ============================================================ */
function FixCost({ t }) {
  const [tab, setTab] = useState("month");
  const [ym, setYm] = useState({ y: 2026, m: 6 });
  const [items, setItems] = useState(
    FIX_TEMPLATES.map((f) => ({ ...f, paid: false, amount: f.isVariable ? null : f.amount }))
  );
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [closed, setClosed] = useState(false);

  const isFuture = ym.y * 100 + ym.m > 202606;
  const isPast = ym.y * 100 + ym.m < 202606;

  const total = items.reduce((s, i) => s + (i.amount || 0), 0);
  const paidSum = items.filter((i) => i.paid).reduce((s, i) => s + (i.amount || 0), 0);
  const paidCount = items.filter((i) => i.paid).length;

  const navMonth = (d) => {
    let m = ym.m + d, y = ym.y;
    if (m > 12) { m = 1; y++; } if (m < 1) { m = 12; y--; }
    setYm({ y, m });
  };
  const toggle = (id) => setItems((p) => p.map((i) => (i.id === id ? { ...i, paid: !i.paid } : i)));
  const startEdit = (i) => { setEditId(i.id); setEditVal(i.amount ?? ""); };
  const saveEdit = () => {
    setItems((p) => p.map((i) => (i.id === editId ? { ...i, amount: editVal === "" ? null : Number(editVal) } : i)));
    setEditId(null);
  };

  return (
    <div>
      <PageHead t={t} title="ค่าใช้จ่ายประจำ" />
      {/* tabs */}
      <div style={{ display: "flex", gap: 24, borderBottom: `1px solid ${t.border}`, marginBottom: 22 }}>
        {[["month", "รายการเดือนนี้"], ["tpl", "Template จ่ายประจำ"]].map(([k, label]) => (
          <div key={k} onClick={() => setTab(k)} style={{ paddingBottom: 12, cursor: "pointer", fontSize: 15, fontWeight: tab === k ? 600 : 400, color: tab === k ? t.primary : t.sub, borderBottom: tab === k ? `2px solid ${t.primary}` : "2px solid transparent" }}>
            {label}
          </div>
        ))}
      </div>

      {tab === "month" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <ChevronLeft size={22} color={t.sub} style={{ cursor: "pointer" }} onClick={() => navMonth(-1)} />
              <span style={{ fontSize: 20, fontWeight: 700, color: t.text }}>{ym.y}/{String(ym.m).padStart(2, "0")}</span>
              <ChevronRight size={22} color={t.sub} style={{ cursor: "pointer" }} onClick={() => navMonth(1)} />
              {closed && <Badge t={t} color={t.green}>ปิดรอบแล้ว</Badge>}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {!isPast && <Btn t={t} variant="ghost" icon={Download}>ดึงจาก template</Btn>}
              <Btn t={t} variant="ghost" icon={Lock} onClick={() => setClosed(true)}>ปิดรอบ เก็บประวัติ</Btn>
              <Btn t={t} icon={Plus} onClick={() => setAddOpen(true)}>เพิ่มรายการ</Btn>
            </div>
          </div>

          <Card t={t} style={{ padding: 18, marginBottom: 16, display: "flex", gap: 36, flexWrap: "wrap", alignItems: "center" }}>
            <Stat t={t} label="ยอดรวม" value={fmt(total)} />
            <Stat t={t} label="จ่ายแล้ว" value={fmt(paidSum)} color={t.green} />
            <Stat t={t} label="ค้างจ่าย" value={fmt(total - paidSum)} color={t.orange} />
            <div style={{ color: t.sub, fontSize: 14 }}>{paidCount} รายการ / {items.length}</div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map((i) => (
              <Card key={i.id} t={t} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <input type="checkbox" checked={i.paid} onChange={() => toggle(i.id)} style={{ width: 18, height: 18, cursor: "pointer", accentColor: t.green }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: t.text, textDecoration: i.paid ? "line-through" : "none", opacity: i.paid ? 0.55 : 1 }}>
                    {i.name}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <Badge t={t} color={catColor(i.categoryId)}>{catName(i.categoryId)}</Badge>
                    {i.isVariable && <Badge t={t} color={t.sub}>กรอกเอง</Badge>}
                  </div>
                </div>
                {editId === i.id ? (
                  <input autoFocus value={editVal} onChange={(e) => setEditVal(e.target.value)} onBlur={saveEdit} onKeyDown={(e) => e.key === "Enter" && saveEdit()} style={{ ...inputStyle(t), width: 120, textAlign: "right" }} />
                ) : (
                  <div onClick={() => startEdit(i)} style={{ fontSize: 16, fontWeight: 600, cursor: "pointer", color: i.amount == null ? t.orange : t.text, textDecoration: i.paid ? "line-through" : "none", opacity: i.paid ? 0.55 : 1 }}>
                    {i.amount == null ? "แตะเพื่อกรอก" : fmt(i.amount)}
                  </div>
                )}
                <Trash2 size={17} color={t.sub} style={{ cursor: "pointer" }} onClick={() => setItems((p) => p.filter((x) => x.id !== i.id))} />
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === "tpl" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <Btn t={t} icon={Plus}>เพิ่ม template</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FIX_TEMPLATES.map((f) => (
              <Card key={f.id} t={t} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: t.text }}>{f.name}</div>
                  <div style={{ marginTop: 4 }}><Badge t={t} color={catColor(f.categoryId)}>{catName(f.categoryId)}</Badge></div>
                </div>
                <div style={{ fontSize: 15, color: t.sub }}>{f.isVariable ? "กรอกเอง" : fmt(f.amount)}</div>
                <Pencil size={16} color={t.sub} style={{ cursor: "pointer" }} />
                <Trash2 size={16} color={t.sub} style={{ cursor: "pointer" }} />
              </Card>
            ))}
          </div>
        </>
      )}

      {addOpen && (
        <Modal t={t} title="เพิ่มรายการ" onClose={() => setAddOpen(false)}>
          <Field t={t} label="ชื่อรายการ"><input style={inputStyle(t)} placeholder="เช่น ค่าเช่าบ้าน" /></Field>
          <Field t={t} label="จำนวนเงิน (ไม่ใส่ก็ได้ มากรอกทีหลังได้)"><input style={inputStyle(t)} placeholder="0.00" /></Field>
          <Field t={t} label="หมวดหมู่">
            <select style={inputStyle(t)}>
              {CATEGORIES.filter((c) => c.module === "fix").map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: t.text, marginBottom: 18, cursor: "pointer" }}>
            <input type="checkbox" style={{ width: 16, height: 16, accentColor: t.primary }} /> บันทึกเป็น template ด้วย
          </label>
          <Btn t={t} onClick={() => setAddOpen(false)}>บันทึก</Btn>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================
   PAGE: Subscription (สมาชิก/บริการ)
   ============================================================ */
function Subscription({ t }) {
  const monthly = SUBS.reduce((s, x) => s + (x.frequency === "monthly" ? x.amount : x.amount / 12), 0);
  return (
    <div>
      <PageHead t={t} title="สมาชิก/บริการ"><Btn t={t} icon={Plus}>เพิ่มบริการ</Btn></PageHead>
      <Card t={t} style={{ padding: 18, marginBottom: 16, display: "flex", gap: 36, flexWrap: "wrap" }}>
        <Stat t={t} label="รวมต่อเดือน (เฉลี่ย)" value={fmt(monthly)} color={t.primary} />
        <Stat t={t} label="จำนวนบริการ" value={SUBS.length + " รายการ"} />
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {SUBS.map((s) => (
          <Card key={s.id} t={t} style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{s.name}</div>
              <Badge t={t} color={s.frequency === "monthly" ? t.primary : t.orange}>{s.frequency === "monthly" ? "รายเดือน" : "รายปี"}</Badge>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: "10px 0 4px" }}>{fmt(s.amount)}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: t.sub }}>
              <Calendar size={14} /> ต่ออายุ {s.renewalDate}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: Installment (ผ่อนชำระ / Credit Cost)
   ============================================================ */
function Installment({ t }) {
  const statusMeta = {
    active: { label: "กำลังผ่อน", color: t.primary },
    done: { label: "ผ่อนครบ", color: t.green },
    closed_early: { label: "ปิดก่อนกำหนด", color: t.orange },
  };
  const remaining = PLANS.filter((p) => p.status === "active").reduce((s, p) => s + p.perAmount * (p.numInstallments - p.paid), 0);
  return (
    <div>
      <PageHead t={t} title="ผ่อนชำระ"><Btn t={t} icon={Plus}>เพิ่มแผนผ่อน</Btn></PageHead>
      <Card t={t} style={{ padding: 18, marginBottom: 16, display: "flex", gap: 36, flexWrap: "wrap" }}>
        <Stat t={t} label="ยอดคงเหลือทั้งหมด" value={fmt(remaining)} color={t.orange} />
        <Stat t={t} label="แผนที่กำลังผ่อน" value={PLANS.filter((p) => p.status === "active").length + " แผน"} />
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PLANS.map((p) => {
          const pct = Math.round((p.paid / p.numInstallments) * 100);
          const meta = statusMeta[p.status];
          return (
            <Card key={p.id} t={t} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: t.text }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: t.sub, marginTop: 4 }}>{cardName(p.cardId)} · {catName(p.categoryId)}</div>
                </div>
                <Badge t={t} color={meta.color}>{meta.label}</Badge>
              </div>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap", margin: "14px 0 10px" }}>
                <Stat t={t} label="ยอดรวม" value={fmt(p.totalAmount)} />
                <Stat t={t} label="งวดละ" value={fmt(p.perAmount)} />
                <Stat t={t} label="งวด" value={`${p.paid}/${p.numInstallments}`} />
                {p.payoffAmount && <Stat t={t} label="ยอดปิด" value={fmt(p.payoffAmount)} color={t.orange} />}
              </div>
              <div style={{ height: 8, background: t.cardAlt, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", background: meta.color, borderRadius: 999 }} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: Cards (บัตรเครดิต)
   ============================================================ */
function CardsPage({ t }) {
  return (
    <div>
      <PageHead t={t} title="บัตรเครดิต"><Btn t={t} icon={Plus}>เพิ่มบัตร</Btn></PageHead>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {CARDS.map((c) => (
          <Card t={t} key={c.id} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ background: t.appbar, padding: 20, color: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <CreditCard size={22} />
                <span style={{ fontSize: 13, opacity: 0.8 }}>{bankName(c.bankId)}</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 24 }}>{c.name}</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>•••• •••• •••• ••••</div>
            </div>
            <div style={{ padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Badge t={t} color={c.type === "credit" ? t.primary : t.green}>{c.type}</Badge>
              <Badge t={t} color={c.active ? t.green : t.sub}>{c.active ? "ใช้งาน" : "ปิด"}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   PAGE: Ledger (รายการทั้งหมด)
   ============================================================ */
function Ledger({ t }) {
  const rows = [
    { name: "Home loan", type: "fix", amount: 7800, cat: "c-loan", card: null, m: "2026/06" },
    { name: "iPad Pro (5/10)", type: "installment", amount: 3386, cat: "c-gadget", card: "cd-premier", m: "2026/06" },
    { name: "Netflix", type: "subscription", amount: 201, cat: "c-ent", card: null, m: "2026/06" },
    { name: "Electricity bill", type: "fix", amount: 2008.73, cat: "c-util", card: null, m: "2026/06" },
    { name: "ลำโพง (2/6)", type: "installment", amount: 1498.35, cat: "c-gadget", card: "cd-soSmart", m: "2026/06" },
    { name: "Home Internet", type: "subscription", amount: 747.93, cat: "c-ent", card: null, m: "2026/06" },
  ];
  const typeLabel = { fix: "ประจำ", subscription: "บริการ", installment: "ผ่อน", manual: "อื่นๆ" };
  return (
    <div>
      <PageHead t={t} title="รายการทั้งหมด">
        <Btn t={t} variant="ghost" icon={Calendar}>2026/06</Btn>
        <Btn t={t} variant="ghost" icon={Download}>ส่งออก CSV</Btn>
      </PageHead>
      <Card t={t} style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "12px 18px", fontSize: 13, color: t.sub, borderBottom: `1px solid ${t.border}`, fontWeight: 500 }}>
          <div>รายการ</div><div>ประเภท</div><div>หมวดหมู่</div><div>บัตร</div><div style={{ textAlign: "right" }}>จำนวน</div>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", padding: "13px 18px", fontSize: 14, color: t.text, borderBottom: i < rows.length - 1 ? `1px solid ${t.border}` : "none", alignItems: "center" }}>
            <div>{r.name}</div>
            <div><Badge t={t} color={t.sub}>{typeLabel[r.type]}</Badge></div>
            <div style={{ color: catColor(r.cat) }}>{catName(r.cat)}</div>
            <div style={{ color: t.sub, fontSize: 13 }}>{r.card ? cardName(r.card) : "—"}</div>
            <div style={{ textAlign: "right", fontWeight: 600 }}>{fmt(r.amount)}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ============================================================
   PAGE: Banks / Categories / Users (admin)
   ============================================================ */
function SimpleList({ t, title, addLabel, rows }) {
  return (
    <div>
      <PageHead t={t} title={title}><Btn t={t} icon={Plus}>{addLabel}</Btn></PageHead>
      <Card t={t}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: i < rows.length - 1 ? `1px solid ${t.border}` : "none" }}>
            {r.color && <span style={{ width: 12, height: 12, borderRadius: 4, background: r.color }} />}
            <div style={{ flex: 1, color: t.text, fontSize: 15 }}>{r.label}</div>
            {r.meta && <span style={{ fontSize: 13, color: t.sub }}>{r.meta}</span>}
            <Pencil size={16} color={t.sub} style={{ cursor: "pointer" }} />
            <Trash2 size={16} color={t.sub} style={{ cursor: "pointer" }} />
          </div>
        ))}
      </Card>
    </div>
  );
}
const Banks = ({ t }) => <SimpleList t={t} title="ธนาคาร" addLabel="เพิ่มธนาคาร" rows={BANKS.map((b) => ({ label: b.name, meta: CARDS.filter((c) => c.bankId === b.id).length + " บัตร" }))} />;
const Categories = ({ t }) => {
  const mod = { fix: "ประจำ", subscription: "บริการ", credit: "ผ่อน" };
  return <SimpleList t={t} title="หมวดหมู่" addLabel="เพิ่มหมวดหมู่" rows={CATEGORIES.map((c) => ({ label: c.name, color: c.color, meta: mod[c.module] }))} />;
};
const UsersPage = ({ t }) => <SimpleList t={t} title="ผู้ใช้" addLabel="เพิ่มผู้ใช้" rows={[{ label: "Administrator", meta: "admin" }, { label: "dev-01", meta: "user" }]} />;

/* ============================================================
   PAGE: Settings (ตั้งค่า)
   ============================================================ */
function SettingsPage({ t, dark, setDark }) {
  return (
    <div>
      <PageHead t={t} title="ตั้งค่า" />
      <Card t={t} style={{ padding: 8, maxWidth: 560 }}>
        {[
          ["สกุลเงิน (แสดงผล)", "THB (฿)"],
          ["ภาษา", "ไทย"],
          ["วันเริ่มรอบบิล", "วันที่ 1"],
        ].map(([k, v], i) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 14px", borderBottom: `1px solid ${t.border}` }}>
            <span style={{ color: t.text, fontSize: 15 }}>{k}</span>
            <span style={{ color: t.sub, fontSize: 14 }}>{v}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 14px" }}>
          <span style={{ color: t.text, fontSize: 15 }}>ธีม</span>
          <Btn t={t} variant="ghost" icon={dark ? Sun : Moon} onClick={() => setDark((d) => !d)}>{dark ? "สว่าง" : "มืด"}</Btn>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   APP SHELL
   ============================================================ */
const NAV_MAIN = [
  ["overview", "ภาพรวม", LayoutGrid],
  ["fix", "ค่าใช้จ่ายประจำ", ReceiptText],
  ["sub", "สมาชิก/บริการ", Repeat],
  ["credit", "ผ่อนชำระ", Wallet],
  ["cards", "บัตรเครดิต", CreditCard],
  ["all", "รายการทั้งหมด", ListChecks],
  ["settings", "ตั้งค่า", Settings],
];
const NAV_ADMIN = [
  ["banks", "ธนาคาร", Landmark],
  ["categories", "หมวดหมู่", Tags],
  ["users", "ผู้ใช้", Users],
];

export default function App() {
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState("fix");
  const t = useMemo(() => T(dark), [dark]);

  const NavItem = ([key, label, Icon]) => {
    const active = page === key;
    return (
      <div key={key} onClick={() => setPage(key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, cursor: "pointer", marginBottom: 2, background: active ? t.activeBg : "transparent", color: active ? "#fff" : t.text, fontSize: 14, fontWeight: active ? 600 : 400 }}>
        <Icon size={19} /> {label}
      </div>
    );
  };

  const pages = {
    overview: <Dashboard t={t} />,
    fix: <FixCost t={t} />,
    sub: <Subscription t={t} />,
    credit: <Installment t={t} />,
    cards: <CardsPage t={t} />,
    all: <Ledger t={t} />,
    settings: <SettingsPage t={t} dark={dark} setDark={setDark} />,
    banks: <Banks t={t} />,
    categories: <Categories t={t} />,
    users: <UsersPage t={t} />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: t.page, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* sidebar */}
      <aside style={{ width: 240, background: t.sidebar, borderRight: `1px solid ${t.border}`, padding: 16, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: t.primary, padding: "8px 14px 20px" }}>Debt Tracker</div>
        {NAV_MAIN.map(NavItem)}
        <div style={{ fontSize: 12, color: t.sub, padding: "20px 14px 8px", letterSpacing: 0.5 }}>จัดการระบบ</div>
        {NAV_ADMIN.map(NavItem)}
      </aside>

      {/* main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ background: t.appbar, color: "#fff", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Debt Tracker</div>
          <div onClick={() => setDark((d) => !d)} style={{ cursor: "pointer" }}>{dark ? <Sun size={20} /> : <Moon size={20} />}</div>
        </header>
        <main style={{ padding: 28, flex: 1, overflow: "auto" }}>{pages[page]}</main>
      </div>
    </div>
  );
}